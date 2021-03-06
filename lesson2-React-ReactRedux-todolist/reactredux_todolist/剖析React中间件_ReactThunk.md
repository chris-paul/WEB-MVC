### 理解react中间件 以经典的thunk为例讲解：

+ 在项目中我们经常会使用中间件,我们一般会像下面这样使用react中间件
```javascript
'use strict';
import { createStore, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';

const createStoreWithMdware = applyMiddleware(
            thunkMiddleware
        )(createStore);
//返回加强版的createStore
export default createStoreWithMdware; 
//创建store
let store = createStoreWithMiddleware(rootReducer, initialState);  
```
+ 理解applyMiddleware和compose
+ applyMiddleware作为一个store enhancer,去加强createStore,赋予他更多的功能,可以去处理中间件,所以这个
applyMiddleware是使用中间件必须的加载的函数
``` javascript
import compose from './compose'
export default function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, initialState, enhancer) => {
  //作为store返回
    var store = createStore(reducer, initialState, enhancer)
    var dispatch = store.dispatch
    var chain = []
    /*
    * 我们用 applyMiddleware 是为了改造 dispatch 的，所以 applyMiddleware 执行完后，dispatch 是变化了的，而 middlewareAPI 是 applyMiddleware 执行中分发到各个 middleware，所以必须用匿名函数包裹 dispatch， 这样只要 dispatch 更新了， middlewareAPI 中的 dispatch 应用也会发生变化
     */
    var middlewareAPI = {
      getState: store.getState,
      dispatch: (action) => dispatch(action)
    }
    //将每一个store用中间件进行处理,得到的结果存储到数组中
    chain = middlewares.map(middleware => middleware(middlewareAPI))
    //处理得到不一样的dispatch
    dispatch = compose(...chain)(store.dispatch)
    return {
      ...store,
      dispatch
    }
  }
}

export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  } else {
  //最后一个函数
    const last = funcs[funcs.length - 1]
    //第一个到倒数第二个函数
    const rest = funcs.slice(0, -1)
    return (...args) => rest.reduceRight((composed, f) => f(composed), last(...args))
  }
}

```
+ thunk中间件源码

``` javascript
//react中间件的基本格式
function middleware({dispatch, getState}) {
    return function (next) {
        return function (action) {
            return next(action);
        }
    }
}

//thunk中间件经典的11行代码
function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }
    return next(action);
  };
}
const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;
export default thunk;

```
+ 我们可以看到我们返回的createStoreWithMdware就是下面这种形式,store还是那个store,但是dispatch已经得到了改变。
``` javascript
function (reducer, initialState, enhancer){
      .......
      return {
          ...store,
          dispatch
     }

}
```
+ 一步步剖析
  + 第一步通过执行thunk中间件,此时的chain数组是这样一个函数
``` javascript
    function(next){
             return function(action){
               if (typeof action === 'function') {
                 return action(dispatch, getState, extraArgument);
               }
               return next(action);
            }
       }
```
+ 第二步compose(...chain)返回
``` javascript
  function (args){
  //rest，last不在多说,典型的闭包防止全局污染，
  //reduceRight方法的 第一参数是 callback(preValue,curValue) ,第二个参数    //是要传递给callback作为第一个参数preValue来使用的
  return rest.reduceRight((composed, f) => f(composed), last(...args))
  }
```
+ 第三步compose(...chain)(store.dispatch)

此时last就是第一步所得函数,args就是store.dispatch,经过一步步的加强,最后得到的dispatch是
``` javascript
 return function(action){
     if (typeof action === 'function') {
       return action(dispatch, getState, extraArgument);
     }
     return next(action);
  }
```       

### 为什么要使用thunk中间件
createStore的源码已经说过了,就在旁边的md文件中,因为每一个触发action之后都会立即执行reducer去更新View,但是对于一个异步请求,如何在请求结束之后在更新一个view,
答案很简单,就是在调用结束之后dispatch,thunk可以dispatch一个函数,巧妙的解决了异步问题,使用thunk之后,我们的action返回的不在是一个纯对象,可以直接dispatch一个函数
``` javascript
let ns = nameSpace('WATERMARKDETAILS');
export const GET_DATA = ns('GET_DATA');
//获取水印详情
export function getWaterMarkDetails(activityId,activityname,specialized,seller_type,pageno = 1){
  return (dispatch) => {
    /*0---成功  1----失败*/
    api({
      method:'/Watermark/waterMarkLogNumiid',
      args:{
        activityId:activityId,
        pageno:pageno,
        type:'3'
      },
      mode:'json',
      callback:(res)=>{
        dispatch({
          type:GET_DATA,
          dataSource:res        
        })
      }，
      errCallback:(err)=>{
      }
    })  
```   
### applyMiddleware的两种写法 ,createStore的讲解在另外一篇

因此在applyMiddleware的时候，就会存在两种写法，这里我们以利用redux-thunk为例。

+ 直接调用applyMiddleware生成新的createStore
``` javascript
import thunk from 'redux-thunk'
let createStoreWithMiddleware = applyMiddleware(thunk)(createStore)
``` 
+ 在createStore中调用
``` javascript
import thunk from 'redux-thunk'
let createStoreWithMiddleware = createStore(reducer,preState,applyMiddleware(thunk))
``` 
### 实现自己的中间件和store Enhancer

#### 类似于thunk,我们实现promise中间件解决react的异步问题
```javascript
/**
 * 通过是否有promise.then方法判断是否为promise对象
 * @param  {[type]}  obj [description]
 * @return {Boolean}     [description]
 */
function isPromise(obj) {
  return obj && typeof obj.then === 'function';
}

export default function promiseMiddleware({dispatch}) {
  return (next) => (action) => {
    const {types, promise, ...rest} = action;
    if (!isPromise(promise) || !(action.types && action.types.length === 3)) {
      return next(action);
    }
  //分别代表promise处于不同的status时候,对应的action类型
    const [PENDING, DONE, FAIL] = types;

    dispatch({...rest, type: PENDING});
    //发送请求
    return action.promise.then(
      (result) => dispatch({...rest, result, type: DONE}),
      (error) => dispatch({...rest, error, type: FAIL})
    );
  };
}
```
#### 使用方式
```javascript
export const fetchWeather = (cityCode) => {
  const apiUrl = `/data/cityinfo/${cityCode}.html`;

  return {
    promise: fetch(apiUrl).then(response => {
      if (response.status !== 200) {
        throw new Error('Fail to get response with status ' + response.status);
      }
      return response.json().then(responseJson => responseJson.weatherinfo);
    }),
    types: [FETCH_STARTED, FETCH_SUCCESS, FETCH_FAILURE]
  };

}
```

#### 实现自己的store增强器(就是返回加强版本的createStore)，这个例子主要是在store对象不改变的情况下,改变store的reducer和state
```javascript
const RESET_ACTION_TYPE = '@@RESET';
const resetReducerCreator = (reducer, resetState) => (state, action) => {
  if (action.type === RESET_ACTION_TYPE) {
    return action.state;
  } else {
    return reducer(state, action);
  }
};

const reset = (createStore) => (reducer, preloadedState, enhancer) => {
  const store = createStore(reducer, preloadedState, enhancer);

  const reset = (resetReducer, resetState) => {
    const newReducer = resetReducerCreator(resetReducer, resetState);
    //先注册reducer
    store.replaceReducer(newReducer);
    //然后通过dispatch,去改变state
    store.dispatch({type: RESET_ACTION_TYPE, state: resetState});
  };

  return {
    ...store,
    reset
  };
};

export default reset;

```