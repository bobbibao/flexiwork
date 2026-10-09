import ApiService from "@/core/services/api.service";
// import DataService from "@/core/services/data.service";

//action types
export const GET_DASHBOARD_SUMMARY = "getDashboardSummary";
export const GET_DASHBOARD_REVENUE = "getDashboardRevenue";
export const GET_PROJECT_STATS = "getProjectStats";
export const GET_PROJECT_EMPLOYEES_STATS = "getProjectEmployeesStats";
export const GET_PROJECT_OVERVIEW_STATS = "getProjectOverviewStats";
export const GET_DASHBOARD_PROJECTS_STATS = "getDashboardProjectsStats";
export const GET_EMPLOYEES_STATS = "getEmployeesStats";
export const GET_FILTERED_PROJECTS = "getFilteredProjects";

//mutation types
export const SET_DASHBOARD_SUMMARY = "setDashboardSummary";
export const SET_DASHBOARD_REVENUE = "setDashboardRevenue";
export const SET_PROJECT_STATS = "setProjectStats";
export const SET_PROJECT_EMPLOYEES_STATS = "setProjectEmployeesStats";
export const SET_PROJECT_OVERVIEW_STATS = "setProjectOverviewStats";
export const SET_PROJECTS_STATS = "setProjectsStats";
export const SET_EMPLOYEES_STATS = "setEmployeesStats";
export const SET_FILTERED_PROJECTS = "setFilteredProjects";
export const SET_DASHBOARD_ERROR = "setDashboardError";

const state = {
  error: null,
  summary: {},
  revenue: [],
  projects: [],
  employees: [],
  project_employees: [],
  project_overview: [],
  project: [],
  filtered_projects: []
};

const getters = {
  currentSummary(state) {
    return state.summary;
  },
  currentRevenue(state) {
    return state.revenue;
  },
  currentProjectsStats(state) {
    return state.projects;
  },
  currentEmployeesStats(state) {
    return state.employees;
  },
  currentProjectStats(state) {
    return state.project;
  },
  currentProjectEmployeesStats(state) {
    return state.project_employees;
  },
  currentProjectOverviewStats(state) {
    return state.project_overview;
  },
  currentFilteredProjects(state) {
    return state.filtered_projects;
  }
};

const mutations = {
  [SET_DASHBOARD_ERROR](state, error) {
    state.error = error;
  },
  [SET_DASHBOARD_SUMMARY](state, data) {
    state.summary = data.payload;
    state.error = null;
  },
  [SET_DASHBOARD_REVENUE](state, data) {
    state.revenue = data.payload;
    state.error = null;
  },
  [SET_PROJECTS_STATS](state, data) {
    state.projects = data.payload;
    state.error = null;
  },
  [SET_EMPLOYEES_STATS](state, data) {
    state.employees = data.payload;
    state.error = null;
  },
  [SET_PROJECT_STATS](state, data) {
    state.project = data.payload;
    state.error = null;
  },
  [SET_PROJECT_EMPLOYEES_STATS](state, data) {
    state.project_employees = data.payload;
    state.error = null;
  },
  [SET_PROJECT_OVERVIEW_STATS](state, data) {
    state.project_overview = data.payload;
    state.error = null;
  },
  [SET_FILTERED_PROJECTS](state, data) {
    state.filtered_projects = data.payload;
    state.error = null;
  }
};

const actions = {
  async [GET_DASHBOARD_SUMMARY](context) {
    await ApiService.get("dashboard/summary")
      .then(({ data }) => {
        context.commit(SET_DASHBOARD_SUMMARY, data);
      })
      .catch(({ response }) => {
        context.commit(SET_DASHBOARD_ERROR, response.data.message);
      });
  },
  async [GET_DASHBOARD_REVENUE](context) {
    await ApiService.get("dashboard/revenue")
      .then(({ data }) => {
        context.commit(SET_DASHBOARD_REVENUE, data);
      })
      .catch(({ response }) => {
        context.commit(SET_DASHBOARD_ERROR, response.data.message);
      });
  },
  async [GET_DASHBOARD_PROJECTS_STATS](context, payload) {
    await ApiService.get(
      `dashboard/projects-stats/?start=${payload.start}&end=${payload.end}&company_id=${payload.company}&status=${payload.status}`
    )
      .then(({ data }) => {
        context.commit(SET_PROJECTS_STATS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_DASHBOARD_ERROR, response.data.message);
      });
  },
  async [GET_EMPLOYEES_STATS](context, payload) {
    await ApiService.get(
      `dashboard/employees-stats?start=${payload.start}&end=${payload.end}&company_id=${payload.company}`
    )
      .then(({ data }) => {
        context.commit(SET_EMPLOYEES_STATS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_DASHBOARD_ERROR, response.data.message);
      });
  },
  async [GET_PROJECT_STATS](context, payload) {
    await ApiService.get(
      `dashboard/projects-stats/${payload.project_id}?start=${payload.start}&end=${payload.end}&company_id=${payload.company}`
    )
      .then(({ data }) => {
        context.commit(SET_PROJECT_STATS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_DASHBOARD_ERROR, response.data.message);
      });
  },
  async [GET_PROJECT_EMPLOYEES_STATS](context, payload) {
    await ApiService.get(
      `dashboard/employees-stats/${payload.project_id}?start=${payload.start}&end=${payload.end}&company_id=${payload.company}`
    )
      .then(({ data }) => {
        context.commit(SET_PROJECT_EMPLOYEES_STATS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_DASHBOARD_ERROR, response.data.message);
      });
  },
  async [GET_PROJECT_OVERVIEW_STATS](context, payload) {
    await ApiService.get(
      `dashboard/projects-stats?start=${payload.start}&end=${payload.end}&company_id=${payload.company}&project_id=${payload.project_id}`
    )
      .then(({ data }) => {
        context.commit(SET_PROJECT_OVERVIEW_STATS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_DASHBOARD_ERROR, response.data.message);
      });
  },
  async [GET_FILTERED_PROJECTS](context, payload) {
    await ApiService.get(`time-overview/projects?company_id=${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_FILTERED_PROJECTS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_DASHBOARD_ERROR, response.data.message);
      });
  }
};

export default {
  state,
  actions,
  mutations,
  getters
};
