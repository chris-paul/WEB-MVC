
import {FETCH_STARTED, FETCH_SUCCESS, FETCH_FAILURE} from './actionTypes.js';
/**
 * 使用promise中间件
 * @param  {[type]} cityCode [description]
 * @return {[type]}          [description]
 */
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