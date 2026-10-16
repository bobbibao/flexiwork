import { randString } from "@/common";
import { defineComponent, VNode } from "vue";

export default defineComponent({
  methods: {
    toast(message: string, type: "success" | "danger" = "success") {
      const h = this.$createElement;
      const toastId = randString(10);

      let svgIcon: VNode;

      if (type === "success") {
        svgIcon = h(
          'svg',
          {
            attrs: {
              width: '25',
              height: '24',
              viewBox: '0 0 25 24',
              fill: 'none',
              xmlns: 'http://www.w3.org/2000/svg',
            }
          },
          [
            h('path', {
              attrs: {
                d: 'M12.5 22C18 22 22.5 17.5 22.5 12C22.5 6.5 18 2 12.5 2C7 2 2.5 6.5 2.5 12C2.5 17.5 7 22 12.5 22Z',
                fill: '#2D8A5C'
              }
            }),
            h('path', {
              attrs: {
                d: 'M8.25 11.9999L11.08 14.8299L16.75 9.16992',
                stroke: 'white',
                'stroke-width': '1.5',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round'
              }
            })
          ]
        );
      } else {
        svgIcon = h(
          'svg',
          {
            attrs: {
              width: '25',
              height: '24',
              viewBox: '0 0 25 24',
              fill: 'none',
              xmlns: 'http://www.w3.org/2000/svg',
            }
          },
          [
            h('path', {
              attrs: {
                d: 'M12.5 22C18 22 22.5 17.5 22.5 12C22.5 6.5 18 2 12.5 2C7 2 2.5 6.5 2.5 12C2.5 17.5 7 22 12.5 22Z',
                fill: '#961431'
              }
            }),
            h('path', {
              attrs: {
                d: 'M12.5 8V13',
                stroke: 'white',
                'stroke-width': '1.5',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round'
              }
            }),
            h('path', {
              attrs: {
                d: 'M12.4941 16H12.5031',
                stroke: 'white',
                'stroke-width': '2',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round'
              }
            })
          ]
        );
      }

      const toastElement = h(
        'div',
        { class: 'toast-content' },
        [
          h(
            'div',
            { class: 'toast-body' },
            [
              svgIcon,
              h('span', message)
            ]
          ),
          h( 
            'button',
            { 
              class: 'btn-close',
              on: {
                click: () => {
                  // @ts-ignore
                  this.$bvToast.hide(toastId);
                }
              } 
            },
            'X'
          )
        ]
      );

      // @ts-ignore
      this.$bvToast.toast([toastElement], {
        id: toastId,
        headerClass: 'd-none',
        toastClass: type === 'success' ? 'toast-success' : 'toast-danger',
        toaster: `b-toaster-top-center flexiwork-toast-top-center`,
        autoHideDelay: 4000,
      });
    }
  }
})
