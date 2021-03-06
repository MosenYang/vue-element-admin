import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'

/**
 *请求线上地址,两步
 * 1.去掉baseUrl,
 * 2.去掉mock文件夹的相关路由
 **/
const service = axios.create({
  // 为什么没有.因为我需要切换mock和线上地址, 把地址分成两段了,完整url在代理里面拼接了,中间这段就省去
  baseURL: process.env.VUE_APP_BASE_API,
  withCredentials: true, // 表示跨域请求时是否需要使用凭证
  timeout: 8000,
  headers: {
    Accept: 'application/json',
    Authorization: localStorage.getItem('suoBang-token') ? 'Bearer ' + localStorage.getItem('suoBang-token') : ''// 记得要拼接空格
  }
})

// 请求拦截器
service.interceptors.request.use(config => {
    if (store.getters.token) {
      config.headers['X-Token'] = getToken()
    }
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

// 响应拦截器 兼容mock和线上接口200/400状态 (Mosen)
service.interceptors.response.use(response => {
    // console.log(response, 'response对象')
    const res = response.data
    if (!res.code) return res //导出表格情况
    if (res.code !== 20000 && res.code !== 200) {
      Message({
        message: res.message || '错误',
        type: 'error',
        duration: 5 * 1000
      })
      if (res.code === 400) {
        Message({
          message: '接口400了',
          type: 'warning',
          duration: 1000
        })
      }
      if (res.code === 401) {
        Message({
          message: 'token异常',
          type: 'warning',
          duration: 1000
        })
      }
      // 50008: 无效token; 50012: 其他客户端登录; 50014: 登录超时;
      if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
        MessageBox.confirm('你可以取消,也可以重新登录!', 'Confirm logout', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {// 重新登录
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        })
      }
      //抛异常处理
      return Promise.reject(res)
    }
    // 正常
    Message({
      message: '接口成功',
      type: 'success',
      duration: 1000
    })
    return res
  },
  error => {
    console.log('错误信息:' + error)
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)
export default service
