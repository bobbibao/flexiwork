import { createRouter, createWebHashHistory } from "vue-router";
import { snRoutes, snAuthRoutes, installSnGuards } from "./sn-routes";

// vue-router 4, hash history keeps the existing URLs (vue-router 3 default mode was "hash").
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      // Shift Network is the product entry point; the legacy ArchApp dashboard stays at /#/dashboard.
      redirect: "/sn",
      component: () => import("@/view/layout/Layout"),
      children: [
        {
          path: "/dashboard",
          name: "dashboard",
          component: () => import("@/view/pages/Dashboard.vue")
        },
        {
          path: "/address",
          name: "address",
          component: () => import("@/view/pages/Address.vue")
        },
        {
          path: "/offer",
          name: "offer",
          component: () => import("@/features/offers")
        },
        {
          path: "/offer/create",
          name: "createOffer",
          component: () => import("@/features/offers/pages/OfferDetail/OfferDetail.vue")
        },
        {
          path: "/offer/:offer_id",
          name: "editOffer",
          component: () => import("@/features/offers/pages/OfferDetail/OfferDetail.vue")
        },
        // This is old offers, create-offer and update-offer page. Remove it later.
        // {
        //   path: "/offer",
        //   name: "offer",
        //   component: () => import("@/features/offers")
        // },
        // {
        //   path: "/offer/create",
        //   name: "createOffer",
        //   component: () => import("@/view/pages/create/CreateOffer.vue")
        // },
        // {
        //   path: "/offer/:offer_id",
        //   name: "editOffer",
        //   component: () => import("@/view/pages/edit/EditOffer.vue")
        // },
        {
          path: "/project-old",
          name: "project",
          component: () => import("@/view/pages/Project.vue")
        },
        {
          path: "/project-new",
          name: "projectNew",
          component: () => import("@/features/projects/pages/Project/Project.vue")
        },
        {
          path: "/invoice",
          name: "invoice",
          component: () => import("@/view/pages/Invoice.vue")
        },
        {
          path: "/expense",
          name: "expense",
          component: () => import("@/view/pages/Expense.vue")
        },
        // {
        //   path: "/timesheet",
        //   name: "timesheet",
        //   component: () => import("@/view/pages/Timesheet.vue")
        // },
        {
          path: "/timesheet",
          name: "timesheet",
          component: () => import("@/features/timesheet/pages/Timesheet/Timesheet.vue")
        },
        {
          path: "/time-overview",
          name: "timeOverview",
          component: () => import("@/view/pages/TimeOverview.vue")
        },
        {
          path: "/task",
          name: "Task",
          component: () => import("@/features/tasks")
        },
        {
          path: "/report",
          name: "report",
          component: () => import("@/view/pages/Report.vue")
        },
        {
          path: "/product",
          name: "product",
          component: () => import("@/view/pages/Product.vue")
        },
        {
          path: "/settings",
          name: "settings",
          component: () => import("@/view/pages/Settings.vue")
        },
        {
          path: "/address/create",
          name: "createAddress",
          component: () => import("@/view/pages/create/CreateAddress.vue")
        },
        {
          path: "/address/:address_id",
          name: "editAddress",
          component: () => import("@/view/pages/edit/EditAddress.vue")
        },
        {
          path: "/project-old/create",
          name: "createProject",
          component: () => import("@/view/pages/create/CreateProject.vue")
        },
        {
          path: "/project",
          name: "newListProjects",
          component: () => import("@/features/projects")
        },
        {
          path: "/project/create",
          name: "newCreateProject",
          component: () => import("@/features/projects/pages/ProjectDetail/ProjectDetail.vue")
        },
        {
          path: "/project/:project_id",
          name: "newEditProject",
          component: () => import("@/features/projects/pages/ProjectDetail/ProjectDetail.vue")
        },
        {
          path: "/project-old/:project_id",
          name: "editProject",
          component: () => import("@/view/pages/edit/EditProject.vue")
        },
        {
          path: "/invoice/create",
          name: "createInvoice",
          component: () => import("@/view/pages/create/CreateInvoice.vue")
        },
        {
          path: "/invoice/:invoice_id",
          name: "editInvoice",
          component: () => import("@/view/pages/edit/EditInvoice.vue")
        },
        {
          path: "/expense/create",
          name: "createExpense",
          component: () => import("@/view/pages/create/CreateExpense.vue")
        },
        {
          path: "/expense/:expense_id",
          name: "editExpense",
          component: () => import("@/view/pages/edit/EditExpense.vue")
        },
        {
          path: "/product/create",
          name: "createProduct",
          component: () => import("@/view/pages/create/CreateProduct.vue")
        },
        {
          path: "/product/:product_id",
          name: "editProduct",
          component: () => import("@/view/pages/edit/EditProduct.vue")
        },
        {
          path: "/product-group/create",
          name: "createGroup",
          component: () => import("@/view/pages/create/CreateGroup.vue")
        },
        {
          path: "/product-group/:group_id",
          name: "editGroup",
          component: () => import("@/view/pages/edit/EditGroup.vue")
        }
      ]
    },
    {
      path: "/error",
      name: "error",
      component: () => import("@/view/pages/error/Error.vue"),
      children: [
        {
          path: "error-1",
          name: "error-1",
          component: () => import("@/view/pages/error/Error-1.vue")
        },
        {
          path: "error-2",
          name: "error-2",
          component: () => import("@/view/pages/error/Error-2.vue")
        },
        {
          path: "error-3",
          name: "error-3",
          component: () => import("@/view/pages/error/Error-3.vue")
        },
        {
          path: "error-4",
          name: "error-4",
          component: () => import("@/view/pages/error/Error-4.vue")
        },
        {
          path: "error-5",
          name: "error-5",
          component: () => import("@/view/pages/error/Error-5.vue")
        },
        {
          path: "error-6",
          name: "error-6",
          component: () => import("@/view/pages/error/Error-6.vue")
        }
      ]
    },
    {
      path: "/",
      component: () => import("@/view/pages/auth/Auth"),
      children: [
        {
          name: "login",
          path: "/login",
          component: () => import("@/view/pages/auth/Login")
        },
        {
          name: "register",
          path: "/register",
          component: () => import("@/view/pages/auth/Register")
        },
        {
          name: "forgotPass",
          path: "/forgot-password",
          component: () => import("@/view/pages/auth/ForgotPass")
        },
        {
          name: "newPass",
          path: "/forgot-password/:slug",
          component: () => import("@/view/pages/auth/NewPass")
        },
        {
          name: "verifyRegister",
          path: "/verify-register/:slug",
          component: () => import("@/view/pages/auth/VerifyRegister")
        }
      ]
    },
    ...snRoutes,
    ...snAuthRoutes,
    {
      path: "/:pathMatch(.*)*",
      redirect: "/404"
    },
    {
      // the 404 route, when none of the above matches
      path: "/404",
      name: "404",
      component: () => import("@/view/pages/error/Error-1.vue")
    },
    {
      path: "/report/list-user", // Export report Employees (current employees)
      name: "exportListUser",
      component: () => import("@/view/pages/pdf/ExportListUser.vue")
    },
    {
      path: "/report/list-job", // Export report Employees (current employees with job and rate)
      name: "exportListJob",
      component: () => import("@/view/pages/pdf/ExportListJob.vue")
    },
    {
      path: "/report/list-project",
      name: "exportListProject",
      component: () => import("@/view/pages/pdf/ExportListProject.vue")
    },
    {
      path: "/report/list-offer", // Export report Offer
      name: "exportListOffer",
      component: () => import("@/view/pages/pdf/ExportListOffer.vue")
    },
    {
      path: "/report/list-invoice", // Export report Invoice
      name: "exportListInvoice",
      component: () => import("@/view/pages/pdf/ExportListInvoice.vue")
    },
    {
      path: "/report/list-address", // Export report Address
      name: "exportListAddress",
      component: () => import("@/view/pages/pdf/ExportListAddress.vue")
    },
    {
      path: "/report/list-flexible-and-holiday/:user_id", // Export report Employees (Flexible time and Holiday)
      name: "exportListFlexibleAndHoliday",
      component: () => import("@/view/pages/pdf/ExportListFlexibleAndHoliday.vue")
    },
    {
      path: "/report/list-user-effort/:user_id", // Export report Employees (Effort)
      name: "exportListUserEffort",
      component: () => import("@/view/pages/pdf/ExportListUserEffort.vue")
    },
    {
      path: "/report/list-effort-external/:project_id",
      name: "exportListEffortExternal",
      component: () => import("@/view/pages/pdf/ExportListEffortExternal.vue")
    },
    {
      path: "/report/list-effort-internal/:project_id",
      name: "exportListEffortInternal",
      component: () => import("@/view/pages/pdf/ExportListEffortInternal.vue")
    },
    {
      path: "/report/list-effort-external-without-rate/:project_id",
      name: "exportListEffortExternalWithoutRate",
      component: () => import("@/view/pages/pdf/ExportListEffortExternalWithoutRate.vue")
    },
    {
      path: "/report/list-effort-internal-without-rate/:project_id",
      name: "exportListEffortInternalWithoutRate",
      component: () => import("@/view/pages/pdf/ExportListEffortInternalWithoutRate.vue")
    },
    {
      path: "/report/list-effort-by-phase/:project_id",
      name: "exportListEffortByPhase",
      component: () => import("@/view/pages/pdf/ExportListEffortByPhase.vue")
    },
    {
      path: "/report/list-effort-by-task/:project_id",
      name: "exportListEffortByTask",
      component: () => import("@/view/pages/pdf/ExportListEffortByTask.vue")
    },
    {
      path: "/report/project-with-invoices/:project_id",
      name: "exportProjectByAllInvoices",
      component: () => import("@/view/pages/pdf/ExportProjectByAllInvoices.vue")
    }
  ]
});

installSnGuards(router);

export default router;
