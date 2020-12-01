import React from 'react'
import ReactDOM from 'react-dom'
import ReactPWAInstallProvider from 'react-pwa-install'
import { register } from './serviceWorker'
import App from './App'

import '@iq/iq-ui-kit/lib/iq-ui-kit.css'
import './index.css'

ReactDOM.render(
  <React.StrictMode>
    <ReactPWAInstallProvider>
      <App/>
    </ReactPWAInstallProvider>
  </React.StrictMode>,
  document.getElementById('root'),
)

// function isStandalone() {
//   return window.matchMedia('(display-mode: standalone)').matches ||
//     window.navigator.standalone ||
//     document.referrer.includes('android-app://')
// }

// register({
//   onUpdate: () => {
//     if (isStandalone()) {
//       Message({
//         title: 'New version available',
//         subtitle: 'Please restart the application',
//       })
//     } else {
//       Message({
//         title: 'New version available',
//         subtitle: 'Click here to reload page',
//         onClick: () => window.location.reload(),
//       })
//     }
//   },
//   onSuccess: () => {
//     Message({
//       type: 'success',
//       title: 'Offline ready',
//       timeout: 3000,
//     })
//   },
// })
register()
