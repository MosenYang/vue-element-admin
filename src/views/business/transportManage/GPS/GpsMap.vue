<template>
  <div>
    <div>gps运输</div>
  </div>
</template>
<script>
// import ChildComponents from './ChildComponents.vue'
export default {
  components: {},
  props: {},
  data() {
    return {
      title: '组件标题',
      firstName: '',
      lastName: ''
    }
  },
  computed: {
    fullName() {
      return this.firstName + this.lastName
    }
  },
  watch: {},
  created() {
  },
  mounted() {
  },
  methods: {
    getCurrentDate() {
      return new Date().toLocaleDateString()
    }
  }
}
</script>
<style scoped>
  /*@import "../base/reset.css";*/

</style>
