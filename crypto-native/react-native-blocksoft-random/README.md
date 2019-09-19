
# react-native-blocksoft-random

## Getting started

`$ npm install react-native-blocksoft-random --save`

### Mostly automatic installation **Not working actually(

`$ react-native link react-native-blocksoft-random`

### Manual installation and Development **Done and working

#### iOS

Used examples

https://facebook.github.io/react-native/docs/native-modules-ios

https://github.com/wmcmahan/react-native-calendar-events/blob/master/RNCalendarEvents.m


1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-blocksoft-random` and add `RNBlocksoftRandom.xcodeproj`
3. In XCode, in the project navigator, select your project. 
Add `libRNBlocksoftRandom.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. **Added to prebuild also!**
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.reactlibrary.RNBlocksoftRandomPackage;` to the imports at the top of the file
  - Add `new RNBlocksoftRandomPackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-blocksoft-random'
      	project(':react-native-blocksoft-random').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-blocksoft-random/android')
      	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-blocksoft-random')
  	```
