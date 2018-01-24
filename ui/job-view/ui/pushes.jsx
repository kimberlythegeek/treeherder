import React from 'react';
import { RevisionList } from './revisions';
import { JobGroup } from './groups';
import { JobButton } from './buttons';
import { Provider } from "react-redux";
import { actions, store } from '../redux/store';
import * as aggregateIds from '../aggregateIds';
import { platformMap } from "../../js/constants";
import * as _ from 'lodash';
import { react2angular } from 'react2angular';
import { setupAngularProviders,
         $rootScope,
         $location,
         thJobFilters,
         thEvents,
         ThResultSetStore } from './repo';


const JobPlatformDataComponent = (props) => {
  const titleText = `${props.platform.name} ${props.platform.option}`;
  return (
    <td className='platform'>
      <span title="`${titleText}`">{titleText}</span>
    </td>
  );
};

class JobDataComponent extends React.PureComponent {
  render() {
    return (
      <td className="job-row">
        {this.props.groups.map((group, i) => {
          if (group.symbol !== '?') {
            return (
              group.visible && <JobGroup group={group}
                                         refOrder={i}
                                         key={group.mapKey}
                                         ref={i}
                                         expanded={this.props.expanded}
                                         showDuplicateJobs={this.props.showDuplicateJobs}/>
            );
          }
          return (
            group.jobs.map(job => (
              <JobButton job={job}
                         key={job.id}
                         hasGroup={false}
                         ref={i}
                         refOrder={i}/>
            ))
          );
        })}
      </td>
    );
  };
}

class JobTableRowComponent extends React.PureComponent {

  render() {
    // console.log("render jobtablerowcomponent");
    return (
      <tr id={this.props.platform.id}
          key={this.props.platform.id}>
        <JobPlatformDataComponent platform={this.props.platform}/>
        <JobDataComponent groups={this.props.platform.groups}
                          ref="data"/>
      </tr>
    );
  }
}

class JobTableComponent extends React.Component {
  constructor(props) {
    super(props);

    this.rsMap = null;
    this.pushId = this.props.push.id;
    this.aggregateId = aggregateIds.getResultsetTableId(
      $rootScope.repoName,
      this.pushId,
      this.props.push.revision
    );
    this.state = { platforms: null };

    const showDuplicateJobs = $location.search().duplicate_jobs === 'visible';
    const expanded = $location.search().group_state === 'expanded';
    store.dispatch(actions.pushes.setGlobalGroupStates({ showDuplicateJobs, expanded }));
  }

  applyNewJobs() {
    this.rsMap = ThResultSetStore.getResultSetsMap($rootScope.repoName);
    if (!this.rsMap[this.pushId] || !this.rsMap[this.pushId].rs_obj.platforms) {
      return;
    }

    const platforms = this.rsMap[this.pushId].rs_obj.platforms;
    platforms.forEach((platform) => {
      platform.id = this.getIdForPlatform(platform);
      platform.name = platformMap[platform.name] || platform.name;
      platform.groups.forEach((group) => {
        if (group.symbol !== '?') {
          group.grkey = group.mapKey;
        }
      });
      platform.visible = true;
      platforms[platform.id] = this.filterPlatform(platform);
    });
    this.setState({ platforms });
  }

  // componentWillMount() {
  //   // // Check for a selected job in the result set store
  //   // let selectedJobId = null;
  //   // let selectedJobObj = ThResultSetStore.getSelectedJob($rootScope.repoName);
  //   // if (_.isEmpty(selectedJobObj.job)) {
  //   //   // Check the URL
  //   //   const jobId = $location.search().selectedJob;
  //   //   if (jobId) {
  //   //     selectedJobId = parseInt(jobId);
  //   //   }
  //   // } else {
  //   //   selectedJobId = selectedJobObj.job.id;
  //   // }
  //   //
  //   // $rootScope.selectedJob
  //   // store.dispatch(pushes.actions.setSelectedJobId(selectedJobId));
  //
  //   this.applyNewJobs();
  // }

  componentDidMount() {

    $rootScope.$on(
      thEvents.applyNewJobs, (ev, appliedpushId) => {
        if (appliedpushId === this.pushId) {
          this.applyNewJobs();
        }
      }
    );

    $rootScope.$on(
      thEvents.changeSelection, (ev, direction, jobNavSelector) => {
        this.changeSelectedJob(ev, direction, jobNavSelector);
      }
    );

    $rootScope.$on(
      thEvents.clearSelectedJob, () => {
        store.dispatch(actions.pushes.selectJob(null, $rootScope));
      }
    );

    $rootScope.$on(
      thEvents.globalFilterChanged, () => {
        this.filterJobs();
      }
    );

    $rootScope.$on(
      thEvents.groupStateChanged, () => {
        this.filterJobs();
      }
    );

    $rootScope.$on(
      thEvents.searchPage, () => {
        this.filterJobs();
      }
    );

  }

  changeSelectedJob(ev, direction, jobNavSelector) {
    if ($rootScope.selectedJob) {
      if ($rootScope.selectedJob.push_id !== this.pushId) {
        return;
      }
    }

    const jobMap = ThResultSetStore.getJobMap($rootScope.repoName);
    let el, key, jobs, getIndex;

    if (direction === 'next') {
      getIndex = function (idx, jobs) {
        return idx + 1 > Object.keys(jobs).length - 1 ? 0 : idx + 1;
      };
    } else if (direction === 'previous') {
      getIndex = function (idx, jobs) {
        return idx - 1 < 0 ? Object.keys(jobs).length - 1 : idx - 1;
      };
    }

    // Filter the list of possible jobs down to ONLY ones in the .th-view-content
    // div (excluding pinboard) and then to the specific selector passed
    // in.  And then to only VISIBLE (not filtered away) jobs.  The exception
    // is for the .selected-job.  If that's not visible, we still want to
    // include it, because it is the anchor from which we find
    // the next/previous job.
    //
    // The .selected-job can be invisible, for instance, when filtered to
    // unclassified failures only, and you then classify the selected job.
    // It's still selected, but no longer visible.
    jobs = $(".th-view-content").find(jobNavSelector.selector).filter(":visible, .selected-job, .selected-count");
    if (jobs.length) {
      const selIdx = jobs.index(jobs.filter(".selected-job, .selected-count").first());
      const idx = getIndex(selIdx, jobs);

      el = $(jobs[idx]);
      key = el.attr('data-jmkey');
      if (jobMap && jobMap[key] && selIdx !== idx) {
        this.selectJob(jobMap[key].job_obj);
        return;
      }
    }
    // if there was no new job selected, then ensure that we clear any job that
    // was previously selected.
    if ($(".selected-job").css('display') === 'none') {
      $rootScope.closeJob();
    }
  }

  selectJob(job) {
    // Delay switching jobs right away, in case the user is switching rapidly between jobs
    store.dispatch(actions.pushes.selectJob(job, $rootScope));
    if (this.jobChangedTimeout) {
      window.clearTimeout(this.jobChangedTimeout);
    }
    this.jobChangedTimeout = window.setTimeout(() => {
      $rootScope.$emit(thEvents.jobClick, job);
    }, 200);
  }

  getIdForPlatform(platform) {
    return aggregateIds.getPlatformRowId(
      $rootScope.repoName,
      this.props.push.id,
      platform.name,
      platform.option
    );
  }

  filterJobs() {
    if (_.isEmpty(this.state.platforms)) return;
    const platforms = Object.values(this.state.platforms).reduce((acc, platform) => ({
      ...acc, [platform.id]: this.filterPlatform(platform)
    }), {});
    this.setState({ platforms });
  }

  handleJobClick(ev) {
    console.log("job click in jobTableRowComponent", ev);
  }

  filterPlatform(platform) {
    platform.visible = false;
    platform.groups.forEach((group) => {
      group.visible = false;
      group.jobs.forEach((job) => {
        job.visible = thJobFilters.showJob(job);
        if (this.rsMap && job.state === 'runnable') {
          job.visible = job.visible &&
            this.rsMap[job.result_set_id].rs_obj.isRunnableVisible;
        }
        job.selected = $rootScope.selectedJob ? job.id === $rootScope.selectedJob.id : false;
        if (job.visible) {
          platform.visible = true;
          group.visible = true;
        }
      });
    });
    return platform;
  }

  render() {
    console.log("render JobTableComponent");
    const platforms = this.state.platforms || {};
    return (
      <table id={this.aggregateId} className="table-hover">
        <tbody onClick={this.handleJobClick}>
        {platforms ? Object.keys(platforms).map((id, i) => (
          platforms[id].visible &&
          <JobTableRowComponent platform={platforms[id]}
                                key={id}
                                ref={id}
                                refOrder={i}/>
        )) : <tr>
          <td><span className="fa fa-spinner fa-pulse th-spinner"/></td>
        </tr>}
        </tbody>
      </table>
    );
  }
}

class PushComponent extends React.Component {
  constructor(props) {
    super(props);
    setupAngularProviders(this.props.$injector);

    this.aggregateId = aggregateIds.getResultsetTableId(
      $rootScope.repoName, this.props.push.id, this.props.push.revision
    );
  }

  render() {
    console.log("render push", this.props.push.id);
    return (
      <Provider store={store}>
        <div className="row result-set clearfix">
          {$rootScope.currentRepo &&
          <RevisionList resultset={this.props.push}
                        repo={$rootScope.currentRepo}/>}
          <span className="job-list job-list-pad col-7">
              <JobTableComponent push={this.props.push}/>
            </span>
        </div>
      </Provider>
    );
  }
}

// treeherder.directive('push', ['reactDirective', '$injector', (reactDirective, $injector) =>
//   reactDirective(connect(mapStateToProps)(PushComponent), ['push'], {}, {
//     $injector,
//     store
//   })]);
treeherder.constant('store', store);
treeherder.component('push',
                     react2angular(PushComponent,
                                   ['push'], ['$injector', 'store']));

// export const JobTable = connect(mapJobTableStateToProps)(JobTableComponent);
// export const JobData = connect(mapJobDataStateToProps)(JobDataComponent);
