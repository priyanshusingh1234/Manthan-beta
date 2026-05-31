const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace import { Capacitor } ...
  content = content.replace(/import\s+\{[^}]*Capacitor[^}]*\}\s+from\s+['"]@capacitor\/core['"];?/g, "import { Platform } from 'react-native';");
  content = content.replace(/import\s+Capacitor\s+from\s+['"]@capacitor\/core['"];?/g, "import { Platform } from 'react-native';");
  
  // Replace Capacitor calls
  content = content.replace(/Capacitor\.isNativePlatform\(\)/g, "(Platform.OS !== 'web')");
  content = content.replace(/Capacitor\.getPlatform\(\)/g, "Platform.OS");

  // Replace Share
  content = content.replace(/import\s+\{[^}]*Share[^}]*\}\s+from\s+['"]@capacitor\/share['"];?/g, "import { Share } from 'react-native';");
  content = content.replace(/import\s+\{\s*Share\s+as\s+CapShare\s*\}\s+from\s+['"]@capacitor\/share['"];?/g, "import { Share as CapShare } from 'react-native';");

  // Strip Haptics
  content = content.replace(/import\s+\{[^}]*Haptics[^}]*\}\s+from\s+['"]@capacitor\/haptics['"];?/g, "");
  content = content.replace(/const\s+\{[^}]*Haptics[^}]*\}\s+=\s+await\s+import\(['"]@capacitor\/haptics['"]\);?/g, "");
  content = content.replace(/Haptics\.impact\([^)]*\);?/g, "");
  content = content.replace(/Haptics\.vibrate\([^)]*\);?/g, "");

  // Strip Push Notifications
  content = content.replace(/import\s+\{[^}]*PushNotifications[^}]*\}\s+from\s+['"]@capacitor\/push-notifications['"];?/g, "const PushNotifications = { addListener: () => {}, checkPermissions: () => ({ receive: 'granted' }), requestPermissions: () => ({ receive: 'granted' }), createChannel: () => {}, registerActionTypes: () => {}, register: () => {} };");
  content = content.replace(/const\s+\{[^}]*PushNotifications[^}]*\}\s+=\s+await\s+import\(['"]@capacitor\/push-notifications['"]\);?/g, "const PushNotifications = { addListener: () => {}, checkPermissions: () => ({ receive: 'granted' }), requestPermissions: () => ({ receive: 'granted' }), createChannel: () => {}, registerActionTypes: () => {}, register: () => {} };");
  content = content.replace(/import\(['"]@capacitor\/push-notifications['"]\)\.then\([^)]*\)/g, "");

  // Strip Local Notifications
  content = content.replace(/import\s+\{[^}]*LocalNotifications[^}]*\}\s+from\s+['"]@capacitor\/local-notifications['"];?/g, "const LocalNotifications = { schedule: () => {}, registerActionTypes: () => {}, addListener: () => {} };");
  content = content.replace(/const\s+\{[^}]*LocalNotifications[^}]*\}\s+=\s+await\s+import\(['"]@capacitor\/local-notifications['"]\);?/g, "const LocalNotifications = { schedule: () => {}, registerActionTypes: () => {}, addListener: () => {} };");

  // Strip other Capacitor plugins
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]@capacitor\/status-bar['"];?/g, "const StatusBar = { setOverlaysWebView: () => {}, setStyle: () => {}, setBackgroundColor: () => {} };");
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]@capacitor\/app['"];?/g, "const App = { addListener: () => ({ remove: () => {} }) };");
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]@capacitor\/preferences['"];?/g, "const Preferences = { get: () => ({ value: null }), set: () => {}, remove: () => {} };");
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]@capgo\/capacitor-incoming-call-kit['"];?/g, "const IncomingCallKit = { requestPermissions: () => {}, requestFullScreenIntentPermission: () => {}, showIncomingCall: () => {} };");
  content = content.replace(/const\s+\{[^}]*IncomingCallKit[^}]*\}\s+=\s+await\s+import\(['"]@capgo\/capacitor-incoming-call-kit['"]\);?/g, "const IncomingCallKit = { requestPermissions: () => {}, requestFullScreenIntentPermission: () => {}, showIncomingCall: () => {} };");
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]@capgo\/capacitor-share-target['"];?/g, "const ShareTarget = { addListener: () => ({ remove: () => {} }) };");
  content = content.replace(/const\s+\{[^}]*ShareTarget[^}]*\}\s+=\s+await\s+import\(['"]@capgo\/capacitor-share-target['"]\);?/g, "const ShareTarget = { addListener: () => ({ remove: () => {} }) };");

  if (content !== originalContent) {
    // Add Platform import if needed and if it was not added by the regex directly (i.e. if it replaced Capacitor)
    // Actually the regex replaced Capacitor with Platform. What if React Native is not imported?
    if (content.includes('Platform.OS') && !content.includes("import { Platform")) {
      content = "import { Platform } from 'react-native';\n" + content;
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed capacitor in:', filePath);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.expo' && file !== '.git') {
        traverseDir(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

traverseDir(__dirname);
console.log('Done removing Capacitor!');
