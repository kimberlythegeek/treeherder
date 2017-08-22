export const types = {
  STORE_PLATFORMS: "STORE_PLATFORMS",
  SELECT_JOB: "SELECT_JOB",
  SET_GLOBAL_GROUP_STATES: "SET_GLOBAL_GROUP_STATES",
};

export const actions = {
  storePlatforms: (pushId, platforms) => ({
    type: types.STORE_PLATFORMS,
    payload: {
      pushId, platforms,
    }
  }),
  selectJob: (job, $rootScope) => {
    $rootScope.selectedJob = job;
    const jobId = job ? job.id : null;
    return {
      type: types.SELECT_JOB,
      payload: {
        jobId
      }
    };
  },
  setSelectedJobId: jobId => ({
    type: types.SELECT_JOB,
    payload: {
      jobId,
    }
  }),
  setGlobalGroupStates: states => ({
    type: types.SET_GLOBAL_GROUP_STATES,
    payload: {
      ...states
    }
  }),

};

const initialState = {
  platforms: {},
  selectedJobId: null,
};

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case types.STORE_PLATFORMS:
      return {
        ...state,
        platforms: { ...state.platforms,
                     [action.payload.pushId]: action.payload.platforms }
      };
    case types.SELECT_JOB:
      return {
        ...state,
        selectedJobId: action.payload.jobId
      };
    case types.SET_GLOBAL_GROUP_STATES:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
};
