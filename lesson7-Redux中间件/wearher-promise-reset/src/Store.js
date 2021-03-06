import {createStore, combineReducers, applyMiddleware, compose} from 'redux';

//import thunkMiddleware from 'redux-thunk'
import promiseMiddleware from './middleware/promise_middleware.js';
import addlogMiddleware from './middleware/addlog_middleware.js';
import {reducer as weatherReducer} from './weather/';

const reducer = combineReducers({
  weather: weatherReducer
});

const middlewares = [promiseMiddleware,addlogMiddleware];

const storeEnhancers = compose(
  applyMiddleware(...middlewares),
);

export default createStore(reducer, {}, storeEnhancers);
