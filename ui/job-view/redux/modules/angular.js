export const types = {
  STORE_PROVIDERS: "STORE_PROVIDERS",
};

export const actions = {
  storeProviders: $injector => ({
    type: types.STORE_PROVIDERS,
    payload: {
      $injector,
    }
  })
};

const initialState = {
  $rootScope: {},
  thEvents: {},
  $location: {},
  thUrl: {},
  thJobModel: {},
  thJobFilters: {},
  linkifyBugsFilter: {},
  thResultStatus: {},
  thResultStatusInfo: {},
  ThResultSetStore: {},
};

// As we transition away from Angular and toward React, more and more of these
// providers won't be needed.  But for now, we use these to reach into Angular
// to get the shared functionality there.
export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case types.STORE_PROVIDERS:
      return {
        ...state,
        $rootScope: action.payload.$injector.get('$rootScope'),
        thEvents: action.payload.$injector.get('thEvents'),
        $location: action.payload.$injector.get('$location'),
        thUrl: action.payload.$injector.get('thUrl'),
        thJobModel: action.payload.$injector.get('ThJobModel'),
        // TODO: move these to shared libraries
        thJobFilters: action.payload.$injector.get('thJobFilters'),
        linkifyBugsFilter: action.payload.$injector.get('$filter')('linkifyBugs'),
        thResultStatus: action.payload.$injector.get('thResultStatus'),
        thResultStatusInfo: action.payload.$injector.get('thResultStatusInfo'),
        ThResultSetStore: action.payload.$injector.get('ThResultSetStore'),
      };
    default:
      return state;
  }
};
