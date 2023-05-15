## @flow-connect/audio

[<img alt="npm (scoped)" src="https://img.shields.io/npm/v/@flow-connect/audio?style=flat-square" />](https://www.npmjs.com/package/@flow-connect/audio)
[<img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/saurabh-prosoft/flow-connect-standard-nodes/audio.yml?style=flat-square" />](https://github.com/saurabh-prosoft/flow-connect-standard-nodes/actions/workflows/audio.yml)
[<img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/min/@flow-connect/audio?style=flat-square">](https://bundlephobia.com/package/@flow-connect/audio)

<br/>

> Custom nodes for audio processing using [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

<br/>

### Custom Nodes

- [ADSR](https://flow-connect.saurabhagat.me/reference/standard-nodes/audio/adsr.html) <br/>
  A node that affects [AudioParams](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam) using a fixed envelope of attack-decay-sustain-release pattern with modifiable parameters.
- [AudioBufferSource](https://flow-connect.saurabhagat.me/reference/standard-nodes/audio/audio-buffer-source.html) <br/>
  Creates a new [AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) from an audio file.
- [Automate](https://flow-connect.saurabhagat.me/reference/standard-nodes/audio/automate.html) <br/>
  Fully customizable and interactive envelope.
- [ChannelMerger](https://flow-connect.saurabhagat.me/reference/standard-nodes/audio/channel-merger.html) <br/>
  Merges two or more single-channel audio sources to a single multi-channel output (see [Audio Channels](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Basic_concepts_behind_Web_Audio_API#audio_channels)).
- [Equalizer](https://flow-connect.saurabhagat.me/reference/standard-nodes/audio/equalizer.html) <br/>
  A 10-band equalizer.
- [FrequencyAnalyser](https://flow-connect.saurabhagat.me/reference/standard-nodes/audio/frequency-analyser.html) <br/>
  Performs frequency analysis on the input audio source and displays a real-time graph.
- [Chorus](https://flow-connect.saurabhagat.me/reference/standard-nodes/audio/chorus.html) <br/>
  Adds [chorus effect](https://en.wikipedia.org/wiki/Chorus_(audio_effect)) to the audio source.
- [SpectrogramAnalyser](https://flow-connect.saurabhagat.me/reference/standard-nodes/audio/spectrogram-analyser.html) <br/>
  Performs spectral analysis on the audio source and displays a real-time [spectrogram](https://en.wikipedia.org/wiki/Spectrogram)
- and much more...!

<br/>

Check out the [docs](https://flow-connect.saurabhagat.me/reference/standard-nodes/audio.html) for details on all the custom nodes provided in this package
