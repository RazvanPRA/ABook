/**
 * @format
 */

// Must run before anything uses crypto.getRandomValues (uuid): Hermes has no Web Crypto
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import { App } from './src/app/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
