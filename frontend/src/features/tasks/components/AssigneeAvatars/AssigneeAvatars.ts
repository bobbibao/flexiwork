import { TaskAssignee } from "@/common/models";
import { defineComponent, PropType } from "vue";
import { Avatar } from "@/components";
import { getAssigneeName } from "../../services/tableTasksByProject";

export default defineComponent({
  name: "AssigneeAvatars",
  components: {
    Avatar
  },
  props: {
    assignees: {
      type: Array as PropType<TaskAssignee[]>,
      required: true
    }
  },
  methods: {
    getAssigneeName,
    displayedAssignees() {
      return this.assignees.length > 4 ? this.assignees.slice(0, 3) : this.assignees;
    }
  }
});
