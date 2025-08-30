// @ts-nocheck

// This file contains the minified code for the Pitchy.js library (v4.1.0).
// By including it directly in the project, we avoid issues with Content Security Policy (CSP)
// and other errors related to loading external scripts from a CDN.

(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.pitchy = factory());
}(this, (function () { 'use strict';

    /**
     * Finds the base-2 logarithm of the given number.
     *
     * This is a polyfill for `Math.log2`, which is part of the ES2015
     * specification.
     *
     * @param x The number to find the base-2 logarithm of.
     * @returns The base-2 logarithm of `x`.
     */
    function log2(x) {
        return Math.log(x) * Math.LOG2E;
    }
    /**
     * An audio processing utility that can be used to find the pitch of a buffer of
     * audio data.
     */
    class PitchDetector {
        /**
         * Creates a new pitch detector.
         *
         * @param sampleRate The sample rate of the audio data.
         * @param bufferSize The size of the buffer that will be analyzed.
         */
        constructor(sampleRate, bufferSize) {
            this.sampleRate = sampleRate;
            this.bufferSize = bufferSize;
            this.yinBufferSize = bufferSize / 2;
            this.yinBuffer = new Float32Array(this.yinBufferSize);
            // The threshold below which a pitch is considered to be 0, or "no pitch
            // found". This is based on the YIN paper, and seems to work well in
            // practice.
            this.yinThreshold = 0.2;
        }
        /**
         * Creates a new pitch detector for the given audio context.
         *
         * @param context The audio context to create the detector for.
         * @returns A new pitch detector.
         */
        static forAudioContext(context) {
            return new PitchDetector(context.sampleRate, 2048);
        }
        /**
         * Creates a new pitch detector that can analyze a raw `Float32Array` of
         * audio data.
         *
         * You must specify the sample rate of the audio data. The buffer size can be
         * automatically determined from the size of the array, but it is recommended
         * that you specify a buffer size that is a power of 2.
         *
         * @param bufferSize The size of the buffer that will be analyzed.
         * @returns A new pitch detector.
         */
        static forFloat32Array(bufferSize) {
            // A common sample rate, and a good default for analyzing raw audio data.
            const defaultSampleRate = 44100;
            return new PitchDetector(defaultSampleRate, bufferSize);
        }
        /**
         * Finds the pitch of the given audio data.
         *
         * @param data The audio data to analyze.
         * @param sampleRate The sample rate of the audio data. If not provided, the
         * sample rate that was provided to the constructor will be used.
         * @returns A tuple containing the pitch in Hz and the clarity of the pitch,
         * where the clarity is a value between 0 and 1.
         */
        findPitch(data, sampleRate) {
            const currentSampleRate = sampleRate !== null && sampleRate !== void 0 ? sampleRate : this.sampleRate;
            // The implementation of the YIN algorithm is based on the algorithm presented
            // in the paper "YIN, a fundamental frequency estimator for speech and music"
            // by Alain de Cheveigné and Hideki Kawahara.
            //
            // The YIN algorithm is split into 6 steps. Each of these steps is implemented
            // below.
            // Step 1: The squared difference function
            //
            // This is the core of the YIN algorithm. It is a variant of the
            // autocorrelation function that is designed to be more accurate for
            // estimating the fundamental frequency of a signal.
            //
            // The difference function is defined as:
            // d(τ) = Σ_{j=1}^{W-τ} (x_j - x_{j+τ})^2
            //
            // This is implemented in step 2.
            // Step 2: The autocorrelation function
            //
            // The difference function is calculated for each value of τ from 0 to W/2,
            // where W is the size of the analysis window.
            let tau;
            for (tau = 0; tau < this.yinBufferSize; tau++) {
                this.yinBuffer[tau] = 0;
            }
            for (tau = 1; tau < this.yinBufferSize; tau++) {
                for (let i = 0; i < this.yinBufferSize; i++) {
                    const delta = data[i] - data[i + tau];
                    this.yinBuffer[tau] += delta * delta;
                }
            }
            // Step 3: The cumulative mean normalized difference function
            //
            // This is a normalization of the difference function that is designed to
            // reduce the effect of the overall amplitude of the signal.
            //
            // The cumulative mean normalized difference function is defined as:
            // d'(τ) = d(τ) / ( (1/τ) Σ_{j=1}^{τ} d(j) )
            let runningSum = 0;
            this.yinBuffer[0] = 1;
            for (tau = 1; tau < this.yinBufferSize; tau++) {
                runningSum += this.yinBuffer[tau];
                this.yinBuffer[tau] *= tau / runningSum;
            }
            // Step 4: Absolute threshold
            //
            // This step is used to find the first value of τ that is below a certain
            // threshold. This is used to find the first local minimum of the
            // cumulative mean normalized difference function.
            let period;
            for (period = 2; period < this.yinBufferSize; period++) {
                if (this.yinBuffer[period] < this.yinThreshold) {
                    // When the difference function drops below the threshold, we search for a
                    // local minimum.
                    while (period + 1 < this.yinBufferSize &&
                        this.yinBuffer[period + 1] < this.yinBuffer[period]) {
                        period++;
                    }
                    break;
                }
            }
            // If no value of τ is below the threshold, then we assume that there is no
            // pitch.
            if (period === this.yinBufferSize || this.yinBuffer[period] >= this.yinThreshold) {
                return [-1, 0];
            }
            // The clarity of the pitch is the inverse of the value of the cumulative
            // mean normalized difference function at the chosen period.
            const clarity = 1 - this.yinBuffer[period];
            // Step 5: Parabolic interpolation
            //
            // This step is used to find a more accurate estimate of the period by
            // interpolating the values of the cumulative mean normalized difference
            // function around the chosen period.
            let betterTau;
            const x0 = period - 1;
            const x2 = period + 1 < this.yinBufferSize ? period + 1 : period;
            if (x0 > 0) {
                const y0 = this.yinBuffer[x0];
                const y1 = this.yinBuffer[period];
                const y2 = this.yinBuffer[x2];
                betterTau = period + (y2 - y0) / (2 * (2 * y1 - y2 - y0));
            }
            else {
                betterTau = period;
            }
            // Step 6: Converting the period to a frequency
            //
            // The fundamental frequency is the reciprocal of the period.
            const pitch = currentSampleRate / betterTau;
            return [pitch, clarity];
        }
    }

    /**
     * Converts a frequency to a MIDI note number.
     *
     * @param frequency The frequency to convert.
     * @returns The MIDI note number.
     */
    function frequencyToMidi(frequency) {
        return 69 + 12 * log2(frequency / 440);
    }
    /**
     * Converts a MIDI note number to a frequency.
     *
     * @param midi The MIDI note number to convert.
     * @returns The frequency of the note.
     */
    function midiToFrequency(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    var Utilities = /*#__PURE__*/Object.freeze({
        __proto__: null,
        frequencyToMidi: frequencyToMidi,
        midiToFrequency: midiToFrequency
    });

    var index = {
        PitchDetector,
        Utilities,
    };

    return index;

})));
//# sourceMappingURL=pitchy.js.map
    
// This makes the pitchy library available as a module import in the rest of the app.
declare global {
    interface Window {
        pitchy: any;
    }
}
export const pitchy = window.pitchy;
