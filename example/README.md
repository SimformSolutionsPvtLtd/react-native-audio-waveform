# Example

Shows how to use the waveform within a react-native project

# How to Use

- On the root of the project make sure to have done `yarn install & yarn build:local`
- In the example run `yarn install`

## Android

### Audio File Samples

- Copy mp3 files from `example/src/assets/audio` to your phone in `Android/data/com.audiowaveformexample/cache`
- You can use [openMTP](https://github.com/ganeshrvel/openmtp).

### Example App

In the example folder run `yarn android`

## iOS

- Install [rbenv](http://rbenv.org/)
- Ruby:
  - Install it with `rbenv install 2.7.5`
  - Set it with `rbenv set 2.7.5` in `example` folder
- Install bundler
- In the `example` folder
  - Run `bundle install`
  - Run `bundle exec pod install --project-directory=ios`
  - Run `yarn ios`
