import {
  createStore,
  bindActionCreators,
  combineReducers,
  applyMiddleware,
} from 'redux';
// import * as angular from './modules/angular';
import * as pushes from './modules/pushes';
import createDebounce from 'redux-debounce';

function dummy(store, data) {
  store.dispatch(angular.types.DUMMY, data);
}

const testDataMiddleware = store => next => (action) => {
  if (!action.meta) {
    return next(action);
  }

  const consumed = { ...action };
  delete consumed.meta;

  switch (action.type) {
    case angular.types.DUMMY:
      dummy(store, { ...action.meta });
      return next(consumed);
    default:
      break;
  }

  return next(action);
};

export const configureStore = () => {
  const debounceConfig = { filter: 300 };
  const debouncer = createDebounce(debounceConfig);
  const reducer = combineReducers({
    // angular: angular.reducer,
    pushes: pushes.reducer,
  });
  const store = createStore(reducer, applyMiddleware(debouncer, testDataMiddleware));
  const actions = {
    // angular: bindActionCreators(angular.actions, store.dispatch),
    pushes: bindActionCreators(pushes.actions, store.dispatch),
  };

  return { store, actions };
};

export default configureStore;
