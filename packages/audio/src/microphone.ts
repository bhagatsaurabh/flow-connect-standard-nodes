import { Flow, FlowState, Node, NodeOptions, NodeStyle, TerminalType } from "flow-connect/core";
import { Log } from "flow-connect/utils";

export class Microphone extends Node {
  microphone: MediaStreamAudioSourceNode;
  stream: MediaStream;
  outGain: GainNode;

  get audioCtx(): AudioContext {
    return this.flow.flowConnect.audioContext;
  }

  static DefaultState = {};

  constructor(_flow: Flow, _options: MicrophoneOptions) {
    super();
  }

  protected setupIO(_options: MicrophoneOptions): void {
    this.addTerminals([{ type: TerminalType.OUT, name: "out", dataType: "audio" }]);
  }

  protected created(options: MicrophoneOptions): void {
    const { width = 120, name = "Microphone", state = {}, style = {} } = options;

    this.width = width;
    this.name = name;
    this.state = { ...Microphone.DefaultState, ...state };
    this.style = { ...DefaultMicrophoneStyle(), ...style };

    this.outGain = this.audioCtx.createGain();
    this.outputs[0].ref = this.outGain;

    this.setupListeners();
    this.getMicrophone()
      .then(
        () => {},
        (error) => {
          Log.error("Cannot access microphone: ", error);
        }
      )
      .catch((error) => Log.error(error));
  }

  protected process(_inputs: any[]): void {}

  async getMicrophone() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    this.microphone = this.audioCtx.createMediaStreamSource(this.stream);
  }

  setupListeners() {
    this.flow.flowConnect.on("start", async () => {
      if (!this.stream) {
        try {
          await this.getMicrophone();
          if (this.flow.state !== FlowState.Stopped) this.microphone.connect(this.outGain);
        } catch (error) {
          Log.error("Cannot access microphone: ", error);
          this.call("mic-blocked");
        }
      } else {
        this.microphone.connect(this.outGain);
      }
    });
    this.flow.flowConnect.on("stop", () => this.microphone && this.microphone.disconnect());

    this.outputs[0].on("connect", (_inst, connector) => this.outputs[0].ref.connect(connector.end.ref));
    this.outputs[0].on("disconnect", (_inst, _connector, _start, end) => this.outputs[0].ref.disconnect(end.ref));
  }
}

export interface MicrophoneOptions extends NodeOptions {}

export interface MicrophoneStyle extends NodeStyle {}

const DefaultMicrophoneStyle = (): MicrophoneStyle => ({
  rowHeight: 10,
});
