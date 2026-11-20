import { CalcError, defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    fo: ({ fs, v, vr, vs }) => {
      if (vs >= v) throw new CalcError('The source moves at or above the wave speed: a shock wave (sonic boom) forms and this formula does not apply.');
      return (fs * (v + vr)) / (v - vs);
    },
    fs: ({ fo, v, vr, vs }) => (fo * (v - vs)) / (v + vr),
    vr: ({ fo, fs, v, vs }) => (fo * (v - vs)) / fs - v,
    vs: ({ fo, fs, v, vr }) => v - (fs * (v + vr)) / fo,
    v: ({ fo, fs, vr, vs }) => {
      if (fo === fs) throw new CalcError('With f_o = f_s the wave speed cannot be determined (it cancels out).');
      return (fo * vs + fs * vr) / (fo - fs);
    },
  },
  domain: { fo: 'positive', fs: 'positive', v: 'positive' },
  checks: [
    ({ v, vs }) => (vs >= v ? { level: 'error', message: 'Source speed must be below the wave speed.' } : null),
    ({ v, vr }) => (vr <= -v ? { level: 'error', message: 'The receiver moves away faster than the waves travel, so it never receives them.' } : null),
    ({ fo, fs }) => ({ level: 'info', message: fo > fs ? 'Higher pitch: source and receiver are approaching.' : fo < fs ? 'Lower pitch: source and receiver are moving apart.' : 'No shift.' }),
  ],
  residual: ({ fo, fs, v, vr, vs }) => fo - (fs * (v + vr)) / (v - vs),
});
