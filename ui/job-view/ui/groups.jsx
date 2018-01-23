import { JobButton, JobCountComponent } from "./buttons";
import { connect } from "react-redux";
import * as _ from "lodash";

const mapStateToProps = ({ angular }) => ({ angular });

class JobGroupComponent extends React.Component {
  constructor(props) {
    super(props);

    // The group should be expanded initially if the global group state is expanded
    // It should also be expanded if the currently selected job is in the group
    // $rootScope.selectedJob will not be set on initial load: attempt to find an ID in the querystring:


    // if (!expanded) {
    //   const selectedJobId = parseInt(this.props.angular.$location.search().selectedJob);
    //   if (selectedJobId && this.props.group.jobs.some(job => job.id === selectedJobId )) {
    //     expanded = true;
    //   }
    // }
    this.state = {
      expanded: this.props.expanded || false,
      showDuplicateJobs: false
    };
  }

  componentWillMount() {
    this.props.angular.$rootScope.$on(
      this.props.angular.thEvents.duplicateJobsVisibilityChanged,
      () => {
        this.setState({ showDuplicateJobs: !this.state.showDuplicateJobs });
      }
    );

    this.props.angular.$rootScope.$on(
      this.props.angular.thEvents.groupStateChanged,
      (e, newState) => {
        this.setState({ expanded: newState === 'expanded' });
      }
    );
    this.toggleExpanded = this.toggleExpanded.bind(this);
    // this.items = this.groupButtonsAndCounts();
  }

  toggleExpanded() {
    this.setState({ expanded: !this.state.expanded });
  }

  groupButtonsAndCounts() {
    let buttons = [];
    const counts = [];
    const stateCounts = {};
    if (this.state.expanded) {
      // All buttons should be shown when the group is expanded
      buttons = this.props.group.jobs;
    } else {
      const typeSymbolCounts = _.countBy(this.props.group.jobs, "job_type_symbol");
      this.props.group.jobs.map((job) => {
        if (!job.visible) return;
        const status = this.props.angular.thResultStatus(job);
        let countInfo = this.props.angular.thResultStatusInfo(status, job.failure_classification_id);
        if (['testfailed', 'busted', 'exception'].includes(status) ||
          (typeSymbolCounts[job.job_type_symbol] > 1 && this.state.showDuplicateJobs)) {
          // render the job itself, not a count
          buttons.push(job);
        } else {
          const lastJobSelected = {};
          countInfo = { ...countInfo, ...stateCounts[countInfo.btnClass] };
          if (!_.isEmpty(lastJobSelected.job) && (lastJobSelected.job.id === job.id)) {
            countInfo.selectedClasses = ['selected-count', 'btn-lg-xform'];
          } else {
            countInfo.selectedClasses = [];
          }
          if (stateCounts[countInfo.btnClass]) {
            countInfo.count = stateCounts[countInfo.btnClass].count + 1;
          } else {
            countInfo.count = 1;
          }
          countInfo.lastJob = job;
          stateCounts[countInfo.btnClass] = countInfo;
        }
      });
      Object.entries(stateCounts).forEach(([, countInfo]) => {
        if (countInfo.count === 1) {
          buttons.push(countInfo.lastJob);
        } else {
          counts.push(countInfo);
        }
      });
    }
    return { buttons, counts };
  }

  render() {
    this.items = this.groupButtonsAndCounts();

    return (
      <span className="platform-group">
            <span className="disabled job-group"
                  title={this.props.group.name}
                  data-grkey={this.props.group.grkey}>
              <button className="btn group-symbol"
                      data-ignore-job-clear-on-click={true}
                      onClick={this.toggleExpanded}
                      >{this.props.group.symbol}{
                        this.props.group.tier && <span className="small text-muted">[tier {this.props.group.tier}]</span>
                        }</button>

              <span className="group-content">
                <span className="group-job-list">
                  {this.items.buttons.map((job, i) => (
                    <JobButton job={job}
                               hasGroup={true}
                               key={job.id}
                               ref={i}
                               refOrder={i}/>
                  ))}
                </span>
                <span className="group-count-list">
                  {this.items.counts.map(countInfo => (
                    <JobCountComponent count={countInfo.count}
                                       onClick={this.toggleExpanded}
                                       className={`${countInfo.btnClass}-count`}
                                       title={`${countInfo.count} ${countInfo.countText} jobs in group`}
                                       key={countInfo.lastJob.id}
                                       countKey={countInfo.lastJob.id}/>
                  ))}
                </span>
              </span>
            </span>
          </span>
    );
  }
}

export const JobGroup = connect(mapStateToProps)(JobGroupComponent);
