<template>
  <div class="control-wrap">
    <el-button class="send" @click.stop="click2" size="mini" :disabled="row.has_receipt=='未回单'">查看</el-button>
    <el-button class="edit" @click.stop="click1" size="mini" >编辑</el-button>
  </div>
</template>
<script>
export default {
  props: ['row', 'handlers'],
  methods: {
    click1() {
      this.handlers.editOrder(this.row)
    },
    click2() {
      this.handlers.showPic(this.row)
    }
  }
}
</script>
<style lang="scss" scoped>
  @import "src/styles/mixin.scss";

  .control-wrap {
    display: flex;

    .el-button {
      @extend %blue-btn
    }
    .has_receipt{
      background: #f1f1f1;
    }
    .delete-btn {
      background: #ff0000;
      color: #ffffff;
      border: none;
    }
  }

</style>

