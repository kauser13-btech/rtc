import { createRoot } from 'react-dom/client';
import './scss/custom.scss';
// Put any other imports below so that CSS from your
// components takes precedence over default styles.

import Wrapper from './Wrapper';
// import App from './App';
// import App from './App';
document.body.innerHTML = '<div id="app"></div>';
const root = createRoot(document.getElementById('app'));
root.render(<Wrapper/>);