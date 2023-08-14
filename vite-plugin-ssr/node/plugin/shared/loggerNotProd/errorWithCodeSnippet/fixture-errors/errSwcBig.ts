export const errSwcBig = {
  code: 'GenericFailure',
  line: '6',
  column: '1',
  plugin: 'vite:react-swc',
  id: '/home/rom/code/vite-plugin-ssr/examples/react-full-v1/pages/index/+Page.tsx',
  pluginCode:
    "export default Page\n\nimport React from 'react'\nimport { navigate } from 'vite-plugin-ssr/client/router'\nimport { Counter } from '../../components/Counter'\n\nfunction Page() {\n  return (\n    <>\n      <h1>\n        Welcome to <code>vite-plugin-ssr</code>\n      <h1>\n      This page is:\n      <ul>\n        <li>Rendered to HTML.</li>\n        <li>\n          Interactive. <Counter />\n        </li>\n      </ul>\n      <p>\n        <button\n          onClick={() => {\n            const randomIndex = Math.floor(Math.random() * 3)\n            navigate(['/markdown', '/star-wars', '/hello/alice.mjs'][randomIndex])\n          }}\n        >\n          Random Page\n        </button>\n      </p>\n    </>\n  )\n}\n",
  loc: {
    file: '/home/rom/code/vite-plugin-ssr/examples/react-full-v1/pages/index/+Page.tsx',
    line: '6',
    column: '1'
  },
  frame: '',
  message:
    "\n  \u001b[38;2;255;30;30m×\u001b[0m Expression expected\n    ╭─[\u001b[38;2;92;157;255;1;4m/home/rom/code/vite-plugin-ssr/examples/react-full-v1/pages/index/+Page.tsx\u001b[0m:6:1]\n \u001b[2m 6\u001b[0m │ \n \u001b[2m 7\u001b[0m │ function Page() {\n \u001b[2m 8\u001b[0m │   return (\n \u001b[2m 9\u001b[0m │     <>\n    · \u001b[38;2;246;87;248m     ─\u001b[0m\n \u001b[2m10\u001b[0m │       <h1>\n \u001b[2m11\u001b[0m │         Welcome to <code>vite-plugin-ssr</code>\n \u001b[2m12\u001b[0m │       <h1>\n    ╰────\n\n  \u001b[38;2;255;30;30m×\u001b[0m Unexpected token. Did you mean `{'}'}` or `&rbrace;`?\n    ╭─[\u001b[38;2;92;157;255;1;4m/home/rom/code/vite-plugin-ssr/examples/react-full-v1/pages/index/+Page.tsx\u001b[0m:29:1]\n \u001b[2m29\u001b[0m │       </p>\n \u001b[2m30\u001b[0m │     </>\n \u001b[2m31\u001b[0m │   )\n \u001b[2m32\u001b[0m │ }\n    · \u001b[38;2;246;87;248m▲\u001b[0m\n    ╰────\n\n  \u001b[38;2;255;30;30m×\u001b[0m Unterminated JSX contents\n    ╭─[\u001b[38;2;92;157;255;1;4m/home/rom/code/vite-plugin-ssr/examples/react-full-v1/pages/index/+Page.tsx\u001b[0m:27:1]\n \u001b[2m27\u001b[0m │               Random Page\n \u001b[2m28\u001b[0m │             </button>\n \u001b[2m29\u001b[0m │           </p>\n \u001b[2m30\u001b[0m │ \u001b[38;2;246;87;248m╭\u001b[0m\u001b[38;2;246;87;248m─\u001b[0m\u001b[38;2;246;87;248m▶\u001b[0m     </>\n \u001b[2m31\u001b[0m │ \u001b[38;2;246;87;248m│\u001b[0m     )\n \u001b[2m32\u001b[0m │ \u001b[38;2;246;87;248m╰\u001b[0m\u001b[38;2;246;87;248m─\u001b[0m\u001b[38;2;246;87;248m▶\u001b[0m }\n    ╰────\n\n\nCaused by:\n    Syntax Error",
  stack:
    "Error: \n  \u001b[38;2;255;30;30m×\u001b[0m Expression expected\n    ╭─[\u001b[38;2;92;157;255;1;4m/home/rom/code/vite-plugin-ssr/examples/react-full-v1/pages/index/+Page.tsx\u001b[0m:6:1]\n \u001b[2m 6\u001b[0m │ \n \u001b[2m 7\u001b[0m │ function Page() {\n \u001b[2m 8\u001b[0m │   return (\n \u001b[2m 9\u001b[0m │     <>\n    · \u001b[38;2;246;87;248m     ─\u001b[0m\n \u001b[2m10\u001b[0m │       <h1>\n \u001b[2m11\u001b[0m │         Welcome to <code>vite-plugin-ssr</code>\n \u001b[2m12\u001b[0m │       <h1>\n    ╰────\n\n  \u001b[38;2;255;30;30m×\u001b[0m Unexpected token. Did you mean `{'}'}` or `&rbrace;`?\n    ╭─[\u001b[38;2;92;157;255;1;4m/home/rom/code/vite-plugin-ssr/examples/react-full-v1/pages/index/+Page.tsx\u001b[0m:29:1]\n \u001b[2m29\u001b[0m │       </p>\n \u001b[2m30\u001b[0m │     </>\n \u001b[2m31\u001b[0m │   )\n \u001b[2m32\u001b[0m │ }\n    · \u001b[38;2;246;87;248m▲\u001b[0m\n    ╰────\n\n  \u001b[38;2;255;30;30m×\u001b[0m Unterminated JSX contents\n    ╭─[\u001b[38;2;92;157;255;1;4m/home/rom/code/vite-plugin-ssr/examples/react-full-v1/pages/index/+Page.tsx\u001b[0m:27:1]\n \u001b[2m27\u001b[0m │               Random Page\n \u001b[2m28\u001b[0m │             </button>\n \u001b[2m29\u001b[0m │           </p>\n \u001b[2m30\u001b[0m │ \u001b[38;2;246;87;248m╭\u001b[0m\u001b[38;2;246;87;248m─\u001b[0m\u001b[38;2;246;87;248m▶\u001b[0m     </>\n \u001b[2m31\u001b[0m │ \u001b[38;2;246;87;248m│\u001b[0m     )\n \u001b[2m32\u001b[0m │ \u001b[38;2;246;87;248m╰\u001b[0m\u001b[38;2;246;87;248m─\u001b[0m\u001b[38;2;246;87;248m▶\u001b[0m }\n    ╰────\n\n\nCaused by:\n    Syntax Error"
}
