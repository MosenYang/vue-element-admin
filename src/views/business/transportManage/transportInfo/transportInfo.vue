<!--运输信息-->
<template>
  <div class="page">
    <div class="page-title flex-between">
      <mallki class-name="mallki-text" text="运输信息"/>
      <div class=""></div>
    </div>
    <div class="totalTable-container">
      <div class="flex-between control">
        <div class="limit">
          当前显示:
          <el-select v-model="length"
                     @change="changePageLimit"
                     placeholder="请选择">
            <el-option v-for="item in option"
                       :key="item.value"
                       :label="item.label"
                       :value="item.value"/>
          </el-select>
        </div>
        <div class="filters-btns">
          <div class="inquire-wrap">
            <span>查询:</span>
            <el-input v-model="defParams.query"
                      placeholder="请写查询内容"
                      style="width: 200px;"
                      class="filter-item"
                      @keyup.enter.native="handleSearch"/>
            <el-button v-waves @click="handleSearch" class="filter-item" type="primary" icon="el-icon-search">
              查询
            </el-button>
          </div>
          <el-button v-waves class="filter-item" type="primary">
            <i class="el-icon-refresh"></i>
            重置
          </el-button>
        </div>
      </div>
    </div>
    <div>
      <table-components :table-data="tableData" :selection="true" :pagination="true"
                        :action-config="actionConfig"
                        :isClear="isClear"
                        :page-config="pageData"
                        :column-config="columnData"
                        @filter-change="getFilter"
                        @select-change="getSelect"
                        :headerCellStyle="headerCss"
                        @page-change="pageChange"/>
    </div>
  </div>
</template>
<script>
import tableComponents from '../../components/Tables/dg-table2'
import control from './control'
import waves from '@/directive/waves/index.js' // 水波纹指令
import {
  transportInfoList,
  transportAdd,
  transportLoading,
  transfer,
  transferExport
} from '../../../../api/business/transportMangage/transportInfo'

export default {
  components: { tableComponents },
  props: {},
  data() {
    return {
      query: '',
      defParams: defParams,
      option: option,
      tableData: [],
      columnData: [],
      actionConfig: {
        type: 'customize',
        label: '操作区',
        width: 350,
        fixed: true,
        component: control,
        handlers: {
          changeTransport(row) {
          },
          addTransportAar(row) {
            transportAdd().then()
          },
          createFile(row) {},
          uploadFile(row) {
          }
        }
      },
      filterParam: {},
      totalPage: 0,
      isClear: 0,
      car_status: []
    }
  },
  computed: {

    pageData() {
      return {
        totalPageNum: this.totalPage,
        curPage: this.defParams.currpage
      }
    },
    length: {
      get() {
        if (this.defParams.pagesize) return this.defParams.pagesize + '条/页'
      },
      set(val) {
        this.defParams.pagesize = val
      }
    }
  },
  watch: {},
  async created() {
    await this.getTableList()
    this.mapTableTh()
  },
  mounted() {},
  methods: {
    async getTableList(params) {
      let data = params ? params : this.defParams
      await transportInfoList(data).then((res) => {
        this.info = res.data
        console.log('res.data', res.data.data)
        let {
          data, car_status,
          total_count, pagesize
        } = res.data
        this.tableData = data
        this.totalPage = total_count
        this.defParams.pagesize = pagesize
        this.car_status = car_status
      })
    },
    mapTableTh() {
      console.log(initThData.length, '订单总表表格列数')
      initThData.forEach((item, index) => {
        let config = { ...tableConfig }
        let comConfig = { ...tableConfig.filterConfig }
        config.prop = item.key // 数据字段
        config.thIndex = index
        config.isNeed = item.isNeed === false ? false : true
        config.label = comConfig.label = item.name
        config.type = comConfig.type = item.type
        config.width = item.width ? item.width : '130'
        comConfig.filterKey = item.key
        config.paramKey = comConfig.paramKey = item.paramKey ? item.paramKey : item.key
        if (item.key === 'now_status') {
          comConfig.comData = this.car_status
        }
        if (item.name === '是否有中转订单' || item.name === '是否更新在途') {
          comConfig.comData = [{ name: '是', value: 1 }, { name: '否', value: 0 }]
        }
        config.filterConfig = comConfig
        this.columnData.push(config)
      })
    },
    changePageLimit(val) {
      this.getTableList()
    },
    handleReset() {
      let i = Math.floor(Math.random() * 10 + 1)
      this.isClear = i
      for (let key in this.filterParam) {
        this.filterParam[key] = ''
      }
      console.log('重置', this.filterParam)
      let param = Object.assign(this.defParams, this.filterParam, { currpage: 1 })
      this.getTableList(param)
    },
    //* 搜索
    handleSearch() {
      if (this.defParams.global_query) {
        this.defParams.currpage = 1
        this.getTableList(this.defParams)
      } else {
        this.$message({
          showClose: true,
          message: '请输入查询内容',
          type: 'warning'
        })
      }
    },
    getFilter(val) {
      if (val.dispose_time && val.dispose_time !== '') {//操作时间
        this.defParams.dispose_time_start = val.dispose_time[0]
        this.defParams.dispose_time_end = val.dispose_time[1]
      } else {
        this.defParams.audit_time_start = ''
        this.defParams.audit_time_end = ''
      }
      if (val.create_order_time && val.create_order_time !== '') {// 开单日期
        this.defParams.create_order_time_start = val.create_order_time[0]
        this.defParams.create_order_time_end = val.create_order_time[1]
      } else {
        this.defParams.create_order_time_start = ''
        this.defParams.create_order_time_end = ''
      }
      let param = Object.assign(this.defParams, val, { currpage: 1 })
      this.filterParam = { ...val }
      this.getTableList(param)
      console.log(val, '当前参数')
      console.log(param, '请求参数')
    },
    headerCss() {return 'font-size:16px; font-weight: 800;'},
    getSelect(row) {
      this.selectRow = row
      console.log('this.selectRow', this.selectRow)
    },
    pageChange(val) {
      this.defParams.currpage = val
      this.getTableList(this.defParams)
    },
    upload() {

    }
  },
  directives: { waves }
}

var initThData = [
  {
    name: '批次号',
    key: 'waybill_number',
    type: 'editFilter'
  },
  {
    name: '车牌号',
    key: 'license_plate_number',
    type: 'editFilter'
  },
  {
    name: '所属公司',
    key: 'company',
    type: 'editFilter'
  },
  {
    name: '司机姓名',
    key: 'driver_name',
    type: 'editFilter'
  },
  {
    name: '司机电话',
    key: 'mobile',
    type: 'selectFilter'
  },
  {
    name: '车辆状态',
    key: 'now_status',
    type: 'selectFilter'
  },
  {
    name: '是否有中转订单',
    key: 'has_transfer',
    type: 'selectFilter',
    width: '190'
  },
  {
    name: '是否更新在途',
    key: 'on_the_way_time',
    type: 'selectFilter',
    width: '170'
  },
  {
    name: '发站',
    key: 'start_address',
    type: 'editFilter'
  },
  {
    name: '途径',
    key: 'pathway',
    type: 'editFilter'
  },
  {
    name: '到站',
    key: 'end_address',
    type: 'editFilter'
  },
  {
    name: '发车时间',
    key: 'start_time',
    isNeed: false,
    width: 180
  },
  {
    name: '到达时间',
    key: 'end_time',
    isNeed: false,
    width: 180
  },
  {
    name: '总单数',
    key: 'order_num',
    isNeed: false
  },
  {
    name: '总垫付款',
    key: 'total_advance',
    isNeed: false
  },
  {
    name: '总运费',
    key: 'total_cost',
    isNeed: false
  },
  {
    name: '备注',
    key: 'remark',
    isNeed: false
  }
]
var tableConfig = {
  prop: '', // 参数字段
  label: '', // 名字
  type: '', // 类型当前表头交互类型
  hidden: false,//当前数据多.是否需要渲染
  isNeed: true,// 是否需要搜索项
  thIndex: null,// 下标
  tdComponent: null,// 表格Td 内部组件可以传
  tdConfig: {},// 表格Td 配置项
  fixed: null, // 是否固定
  width: null, // 宽度
  minWidth: '80', // 最小宽度
  resizable: true, // 拖动改变列宽度(需要在 el-table 上设置 border 属性为真)
  showOverflowTooltip: true, // 内容过长隐藏
  align: 'center', // left/center/right内容对齐方式
  headerAlign: 'center', // left/center/right 头对齐方式
  labelClassName: '', // 当前列自定义class
  sortable: false, // 是否排序
  formatter: () => {}, // 排序用字段 v-bind绑定
  filters: [], // 绑定需要条件列表 数组
  filterMethod: () => {}, // 过滤方法 v-bind绑定
  renderHeader: () => {}, // Label区域渲染  v-bind绑定
  filterConfig: {// 过滤组件
    label: null,// filter 组件的table,同表头一致
    type: null,//filter 组件的类型,同表头一致
    component: null,// 传入的组件,
    filterKey: null,//字段对应表头字段
    paramKey: null,
    placeholder: '输入姓名',
    comData: [],
    comProps: null,
    listInfo: {
      fetchData() {},
      callback: () => {}// 回调
    }
  }
}
var option = [
  {
    value: '10',
    label: '10条/页'
  }, {
    value: '30',
    label: '30条/页'
  }, {
    value: '50',
    label: '50条/页'
  }, {
    value: '100',
    label: '100条/页'
  }
]
var defParams = {
  global_query: '',
  pagesize: 10,
  currpage: 1,
  waybill_number: '',//?
  license_plate_number: '',//end_address
  company: '',// 所属公司
  driver_name: '',//司机姓名
  mobile: '',//司机电话
  now_status: '',//车辆状态
  has_transfer: '',//是否有中转订单
  on_the_way_time: '',//是否更新在途
  start_address: '',//发站
  pathway: '',//途径
  end_address: ''//途径
}

</script>
<style lang="scss" scoped>
  @import "src/styles/mixin.scss";

  .page-title {
    font-size: j(30);
    padding: j(10) j(20);
    margin: j(5) 0;
    box-shadow: 0 2px 10px #f2f2f2;
    font-weight: 400;

    .el-button {
      @extend %cyan-btn
    }
  }

  .totalTable-container {
    padding: 0 j(20);

    .el-button {
      @extend %cyan-btn
    }

    .control {
      font-size: j(20);

      .limit {
        font-size: j(12);
        padding-left: j(15);
      }

      .filters-btns {
        @extend %end;
        color: #262626;
        padding: j(15) 0;
        font-size: j(16);

        .inquire-wrap {
          margin-right: j(10);
        }
      }
    }

  }

</style>
