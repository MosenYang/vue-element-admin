<template>
  <div>
    <div class="filterbox">
      <!--筛选项内容区-->
      <div v-if="barData" class="filter-with-count">
        <el-tag v-for="(item, index) in barData"
                :key="index"
                disable-transitions
                closable
                style="margin-right:10px;"
                size="small"
                type="info"
                @close="handleClose($event,item)">
          <span v-if="item.value" style="color:#bbb">{{ item.label }}:</span>{{ item.value }}
        </el-tag>
      </div>
    </div>
    <div v-if="tableData" style="position:relative">
      <el-table ref="elTable" fit border
                v-loading="isLoading"
                :data="tableData"
                :show-summary="summary"
                @row-click="rowClick"
                :header-cell-style="headerCellStyle"
                @selection-change="handleSelectChange">
        <el-table-column v-if="selection" type="selection" width="35"/>
        <!--循环的-->
        <template v-for="(item, index) in columnConfig">
          <el-table-column
            :key="index"
            :prop="item.prop"
            :label="item.label"
            :resizable="item.resizable"
            :width="item.width"
            :align="item.align"
            :header-align="item.headerAlign"
            :show-overflow-tooltip="item.showOverflowTooltip">
            <template slot="header" slot-scope="scope">
              <!-- 表格头部-->
              <span :id="`${item.filterConfig.type}_${item.prop}`"
                    class="customize_filter"
                    style="cursor:pointer;display:inline-block"
                    @click="headerClick($event,item)">
                  <span style="padding-right:3px;">{{ item.label }}</span>
                <!--上下箭头-->
                  <i class="el-icon-caret-bottom" v-if="item.filterConfig && item.isNeed"></i>
                </span>
            </template>
            <!-- -->
          </el-table-column>
        </template>
        <!--操控按钮栏目-->
        <template v-if="actionConfig">
          <!-- 单个按钮 -->
          <el-table-column v-if="actionConfig.type === 'button'" :width="actionConfig.width" label="操作">
            <template slot-scope="scope">
              <el-button size="mini" @click.stop="actionConfig.handler(scope)">
                {{ actionConfig.label }}
              </el-button>
            </template>
          </el-table-column>
          <!-- 传个文字 -->
          <el-table-column v-if="actionConfig.type === 'textBtn'"
                           :width="actionConfig.width"
                           label="操作">
            <template slot-scope="scope">
              <span style="cursor:pointer;" @click.stop="actionConfig.handler(scope)">
                {{ actionConfig.label }}
              </span>
            </template>
          </el-table-column>
          <!-- 自定组件-->
          <el-table-column v-if="actionConfig.type === 'customize' && actionConfig.component"
                           :width="actionConfig.width"
                           :label="actionConfig.label"
                           align="center"
                           :fixed="actionConfig.fixed">
            <template slot-scope="scope">
              <component :is="actionConfig.component"
                         :row="scope.row"
                         :handlers="actionConfig.handlers"
                         @commonHandlerBridge="commonHandlerBridge"
                         @doactive="doactive"/>
              <!--  row 是当前行, handlers 是初始配置的方法传的 -->
            </template>
          </el-table-column>
        </template>
      </el-table>
      <!-- 注册的筛选器 -->
      <div v-clickOutSide="allFilterHide">
        <template v-for="(item, key) in regFilters">
          <div v-show="filterAction[key]" :key="key" :class="{'filterWrap': true}"
               :style="item.position">
            <div class="filterContainer">
              <component
                :is="item.component"
                :key="key"
                :refName="item.refName"
                :dataItems="item.dataItems"
                :filterKey="item.filterKey"
                :listInfo="item.listInfo"
                :comData="item.comData"
                :comProps="item.comProps"
                :placeholder="item.placeholder"
                :unit="item.unit"
                :label='item.label'
                :ftn="item.ftn"
                :type='item.type'
                :show="item.show"
                :user-set-data="item.userSetData"
                @getFilterBridge="getFilterBridge"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
    <!--  分页器区域-->
    <div v-if="pagination" class="paginationWrap">
      <el-pagination background
                     :pager-count="7"
                     layout="prev, pager, next"
                     :page-count="pageConfig.totalPageNum"
                     :current-page.sync="pageConfig.curPage"
                     @current-change="clickPage"/>
    </div>
  </div>
</template>
<script>
import editFilter from './defFilter/edit.vue'
import searchSelectFilter from './defFilter/searchSelect.vue'
import selectFilter from './defFilter/selectFilter.vue'
// 默认筛选器组件
var defComponents = {
  editFilter, // 输入框选择器
  searchSelectFilter,// 自动搜索
  selectFilter//纯下拉
}
// 默认筛选器字段
const ComFilterDefConfig = {
  comData: [],
  label: '',
  userSetData: [],
  dataItems: [],
  comProps: {},
  filterKey: '',
  listInfo: {},
  placeholder: '',
  unit: '',
  ftn: '',
  hideBg: false
}
var _filterAction = {} // 动作状态对象 radio_gender: true
var _curFilter = '' // 当前元素
var _filterbar = null // 点击元素的父元素
export default {
  name: 'DgTable',
  props: {
    columnConfig: {//栏数据
      type: Array,
      default: function() {
        return []
      }
    },
    tableData: {// 表格数据
      type: Array,
      default: function() {
        return []
      }
    },
    selection: {// 多选项开关
      type: Boolean,
      default: false
    },
    pagination: { // 分页器开关
      type: Boolean,
      default: true
    },
    pageConfig: { // 分页器配置
      type: Object,
      default: function() {
        return {
          totalPageNum: 10,
          curPage: 1
        }
      }
    },
    rowClick: { // 行点击事件
      type: Function,
      default: function() {
        return () => {}
      }
    },
    summary: {// 首位合计行 开关
      type: Boolean,
      default: false
    },
    // 操作栏对象
    actionConfig: {
      type: Object,
      default: function() {
        return {}
      }
    },
    // element自带显示加载
    isLoading: {
      type: Boolean,
      default: false
    },
    tableRowClassName: {
      type: Function,
      default: () => {}
    },
    headerCellStyle: {
      type: Function,
      default: ({ row, column, rowIndex, columnIndex }) => {
        return 'fontWeight:600'
      }
    }
  },
  data() {
    return {
      barData: [],
      regFilters: {}, // 所有的组件对象 非常的重要
      filterAction: {},// 动态显示  radio_gender: true
      emitParams: {}
    }
  },
  watch: {
    columnConfig(newValue) {
      if (newValue) {
        this.columnConfig.forEach((item) => {
          if (item.filterConfig) {
            this.doRegFilters(item.filterConfig.type, item)
          }
        })
      }
    }
  },
  mounted: function() {
    this.columnConfig.forEach((item) => {
      if (item.filterConfig) {
        this.doRegFilters(item.filterConfig.type, item)
      }
    })
    window.onresize = () => {
      setTimeout(() => {
        if (_filterbar) this.filterPosition(_filterbar, _curFilter)
      }, 1)
    }
  },
  destroyed() {
    _filterAction = {}// 状态对象
    _filterbar = null// 父级
  },
  methods: {
    clickPage(val) {
      this.$emit('page-change', val)
    },
    //关闭搜索项
    handleClose(tag, item) {
      this.barData.splice(this.barData.indexOf(tag), 1)
      this.emitParams[item.filterKey] = null || ''
      this.$emit('filter-change', this.emitParams)
    },
    // 广播事件(被重复复用)
    getFilterBridge(valObj) {// valObj.value 可能是对象 || 字符
      console.log(valObj, '筛选数据~!!!!')
      let isObj = Object.prototype.toString.call(valObj.value) === '[object Object]'
      let option = {
        label: valObj.label,
        value: valObj.value.name ? valObj.value.name : valObj.value,
        filterKey: valObj.filterKey
      }
      this.barData.forEach((item, index, array) => {
        if (item.label === valObj.label) {
          this.barData.splice(this.barData.indexOf(item), 1)
        }
        return array
      })
      // 给参数赋值: 这里很坑.关键是接口需要的值 或者文字,或者数字
      this.emitParams[valObj.filterKey] = valObj.value.id || valObj.value
      this.barData.push(option)
      this.$emit('filter-change', this.emitParams)
      this.allFilterHide('none')
    },
    // 函数通讯桥梁
    commonHandlerBridge({ func, data }) {
      this.$emit(func, data)
    },
    // 循环方法
    doRegFilters(ftype, columconfig) {
      let filterTag = `${ftype}_${columconfig.prop}`
      if (!defComponents[ftype]) {
        if (columconfig.filterConfig.component) {
          let newFilter = { [ftype]: columconfig.filterConfig.component }
          defComponents = Object.assign({}, defComponents, newFilter)
        }
      } else {
        columconfig.filterConfig.component = defComponents[ftype]
      }
      if (!columconfig.filterConfig) return
      const config = {
        show: false,
        refName: filterTag,// 类型加上字段
        position: { top: 0, left: 0 }
      }
      let filterConfig = Object.assign(config, ComFilterDefConfig, columconfig.filterConfig)
      this.$set(this.regFilters, filterTag, filterConfig) // 把所有的表头都添加上,循环
      this.filterAction = JSON.parse(JSON.stringify(_filterAction))
      return filterTag
    },
    // 表头点击事件
    headerClick(e, item) {
      if (!item.isNeed) return
      e.cancelBubble = true
      const curElId = e.currentTarget.id
      const curParentElId = e.currentTarget.parentElement.parentElement
      if (_filterAction[curElId]) {
        document.querySelector(`#${curElId} i`).setAttribute('class', 'el-icon-caret-bottom')
      } else {
        document.querySelector(`#${curElId} i`).setAttribute('class', 'el-icon-caret-top')
      }

      this.allFilterHide(curElId)
      this.filterPosition(curParentElId, curElId)
      this.$set(_filterAction, curElId, !_filterAction[curElId])
      this.filterAction = _filterAction// 动作对象
      _filterbar = curParentElId
    },
    filterPosition(filterbar, filtertag) {
      var offsetLeft = filterbar.offsetLeft
      var offsetHeight = filterbar.offsetHeight
      let l = filterbar.getBoundingClientRect().left
      let h = filterbar.getBoundingClientRect().top

      if (this.regFilters[filtertag]) {
        this.$set(this.regFilters[filtertag].position, 'top', offsetHeight - 10 + 'px')
        this.$set(this.regFilters[filtertag].position, 'left', offsetLeft + 'px')
      }
    },
    allFilterHide(cfilter) {
      for (var k in _filterAction) {
        if (k !== cfilter) {
          this.$set(_filterAction, k, false)
          if (document.querySelector(`#${k} i`)) {
            document.querySelector(`#${k} i`).setAttribute('class', 'el-icon-caret-bottom')
          }
        }
      }
      this.filterAction = _filterAction
    },

    // 单选或者多选事件
    handleSelectChange(val) {
      this.$emit('select-change', val)
    },
    //自定义组件广播
    doactive(d) {
      this.$emit(d.func, d.args)
    }
  },
  directives: {
    clickOutSide: {
      bind: function(el, binding) {
        function documentHandler(e) {
          if (el.contains(e.target)) {
            return false
          }
          if (binding.expression) {
            binding.value(e)
          }
        }

        el.__vueClickOutside__ = documentHandler
        document.addEventListener('click', documentHandler)
      },
      unbind: function(el) {
        document.removeEventListener('click', el.__vueClickOutside__)
        delete el.__vueClickOutside__
      }
    }
  }
  //完毕
}
</script>
<style scoped>
  /*@import './css/common.css';*/

  .filterbox {
    height: 50px;
    display: flex;
    padding: 0 10px;
    align-items: center;
    background: #f9f9f9;
    width: 100%;
    box-sizing: border-box;
    border-top: 1px solid #ebeef5;
    border-bottom: 1px solid #ebeef5;
    justify-content: space-between;
  }

  .paginationWrap {
    display: flex;
    justify-content: center;
    margin-top: 20px
  }

  .filter-with-count {
    display: flex;
    align-items: center;
  }

  .count {
    color: #909399;
    font-size: 12px;
  }
</style>
