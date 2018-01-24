import { connect } from "react-redux";
import { store, actions } from '../redux/store';
import { $rootScope, thResultStatus, thEvents, thResultStatusInfo, thUrl, ThResultSetStore } from "./repo";

export const JobCountComponent = (props) => {
  const classes = [props.className, 'btn group-btn btn-xs job-group-count filter-shown'];
  return (
    <button className={classes.join(' ')}
            title={props.title}
            // onClick={props.onClick}
            key={props.countKey}>{props.count}</button>
  );
};

const mapStateToProps = ({ pushes }) => ({
  pushes
});

class JobButtonComponent extends React.Component {
  constructor(props) {
    super(props);
    const status = thResultStatus(this.props.job);

    this.state = {
      runnable: (status === 'runnable')
    };

    this.handleJobClick = this.handleJobClick.bind(this);

    if (!this.props.hasGroup) {
      $rootScope.$on(
        thEvents.changeSelection, this.changeJobSelection
      );
    }
  }

  handleJobClick() {
    store.dispatch(actions.pushes.selectJob(
      this.props.job,
      $rootScope
    ));
    $rootScope.selectedJob = this.props.job;
    $rootScope.$emit(thEvents.jobClick, this.props.job);
  }

  handleLogViewerClick() {
    // Open logviewer in a new window
    this.props.ThJobModel.get(
      $rootScope.repoName,
      this.props.job.id
    ).then((data) => {
      if (data.logs.length > 0) {
        window.open(location.origin + '/' +
          thUrl.getLogViewerUrl(this.props.job.id));
      }
    });
  }

  handleRunnableClick() {
    ThResultSetStore.toggeleSelectedRunnableJob(
      $rootScope.repoName,
      this.context.resultsetId,
      this.props.job.ref_data_name
    );
    this.setState({ selected: !this.state.selected });
  }

  onMouseDown(ev) {
    // TODO: need to handle the pinjob case: if (ev.ctrlKey || ev.metaKey)
    if (ev.button === 1) { // Middle click
      this.handleLogViewerClick();
    } else if (this.state.runnable) {
      this.handleRunnableClick();
    } else {
      this.handleJobClick();
    }
  }

  render() {
    if (!this.props.job.visible) return null;
    const status = thResultStatus(this.props.job);
    const statusInfo = thResultStatusInfo(status, this.props.job.failure_classification_id);
    let title = `${this.props.job.job_type_name} - ${status}`;

    if (this.props.job.state === 'completed') {
      const duration = Math.round((this.props.job.end_timestamp - this.props.job.start_timestamp) / 60);
      title += ` (${duration} mins)`;
    }

    const key = `key${this.props.job.id}`;
    const classes = ['btn', key, statusInfo.btnClass];

    if (this.state.runnable) {
      classes.push('runnable-job-btn', 'runnable');
    } else {
      classes.push('job-btn');
    }

    if (this.props.job.id === this.props.pushes.selectedJobId) {
      classes.push(this.state.runnable ? 'runnable-job-btn-selected' : 'selected-job');
      classes.push('btn-lg-xform');
    } else {
      classes.push('btn-xs');
    }

    if (this.props.job.visible) classes.push('filter-shown');

    const attributes = {
      // onMouseDown: this.handleJobClick,
      className: classes.join(' '),
      'data-jmkey': key,
      'data-ignore-job-clear-on-click': true,
      title
    };
    if (status === 'runnable') {
      attributes['data-buildername'] = this.props.job.ref_data_name;
    }
    return <button {...attributes}>{this.props.job.job_type_symbol}</button>;
  }
}

export const JobButton = connect(mapStateToProps)(JobButtonComponent);
