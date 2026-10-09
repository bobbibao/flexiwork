import { defineComponent, PropType } from "vue";
import { Toast, ButtonCustom } from "@/components";
import { ProjectService } from "../../services";

interface ConnectionProject {
  id: number;
  name: string;
}

interface ConnectionItem {
  name: string;
  connected: number;
  projects: ConnectionProject[];
}

const projectService = new ProjectService();

export default defineComponent({
  name: "ShareDialog",
  components: {
    ButtonCustom
  },
  mixins: [Toast],
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: Number as PropType<number | null>,
      default: null
    }
  },
  emits: ["close", "connect", "delete", "update:visible"],
  data() {
    return {
      isVisible: this.visible,
      connections: [] as ConnectionItem[],
      loading: false
    };
  },
  watch: {
    visible(newVal) {
      this.isVisible = newVal;
      if (newVal && this.projectId) {
        this.setupConnections();
      }
    }
  },
  methods: {
    updateVisibility(value: boolean) {
      this.isVisible = value;
      this.$emit("update:visible", value);
    },

    async setupConnections() {
      if (!this.projectId) return;

      try {
        this.loading = true;

        // Get connections
        const currentConnections = await projectService.getConnections();

        // Initialize connections array
        const connectionsList: ConnectionItem[] = [];

        // Process each connection
        for (const connection of currentConnections) {
          const connectionItem: ConnectionItem = {
            name: connection.company.name,
            connected: 0,
            projects: []
          };

          // Get projects for this connection
          const connectProjects = await projectService.getConnectProjects(connection.company.id);
          connectionItem.projects = connectProjects;

          // Add "no connection" option
          connectionItem.projects.unshift({
            id: 0,
            name: this.$t("project.noConnection").toString()
          });

          // Get currently connected projects
          const projectConnectionList = await projectService.getProjectConnectionList(this.projectId);

          // Set selected connections
          for (const project of connectionItem.projects) {
            for (const connected of projectConnectionList) {
              if (project.id === connected.id) {
                connectionItem.connected = project.id;
                break;
              }
            }
          }

          connectionsList.push(connectionItem);
        }

        // Set the connections
        this.connections = connectionsList;
      } catch (error) {
        console.error("Error setting up project sharing:", error);
        this.toast("Unable to set up project sharing", "danger");
      } finally {
        this.loading = false;
      }
    },

    onClose() {
      this.updateVisibility(false);
      this.$emit("close");
    },

    async onConfirm() {
      if (this.loading) return;

      try {
        this.loading = true;

        const projectIds = this.connections.filter(item => item.connected !== 0).map(item => item.connected);

        this.$emit("connect", projectIds);
      } catch (error) {
        console.error("Error connecting projects:", error);
        this.toast("Unable to connect projects", "danger");
      } finally {
        this.loading = false;
      }
    },

    async onDelete() {
      if (this.loading) return;

      try {
        this.loading = true;
        this.$emit("delete");
      } catch (error) {
        console.error("Error removing connections:", error);
        this.toast("Unable to remove connections", "danger");
      } finally {
        this.loading = false;
      }
    }
  }
});
