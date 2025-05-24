
/**
 * Audio analyser for visualization based on frequency data
 */
export class Analyser {
  private analyser: AnalyserNode;
  public data: Uint8Array;
  
  constructor(node: AudioNode) {
    const audioContext = node.context as AudioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.data = new Uint8Array(this.analyser.frequencyBinCount);
    node.connect(this.analyser);
  }
  
  update() {
    this.analyser.getByteFrequencyData(this.data);
  }
}
