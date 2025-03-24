import { useState } from 'react';
import { submitCustomTuneRequest } from '../lib/firebaseHelpers';

export default function CustomTune() {
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      motor: e.target.motor.value,
      controller: e.target.controller.value,
      battery: e.target.battery.value,
      goals: e.target.goals.value,
      pas: e.target.pas.checked,
      regen: e.target.regen.checked,
      fw: e.target.fw.checked,
      thermal: e.target.thermal.checked
    };
    try {
      await submitCustomTuneRequest(data);
      setStatus('Request submitted successfully.');
    } catch (err) {
      setStatus('Error submitting request.');
    }
  };

  return (
    <main>
      <h1>Request a Custom Tune</h1>
      <form onSubmit={handleSubmit}>
        <label>Motor Type: <input type="text" name="motor" /></label><br />
        <label>Controller: <input type="text" name="controller" /></label><br />
        <label>Battery Setup: <input type="text" name="battery" /></label><br />
        <label>Performance Goals: <textarea name="goals" /></label><br />
        <label>PAS? <input type="checkbox" name="pas" /></label><br />
        <label>Regen? <input type="checkbox" name="regen" /></label><br />
        <label>Field Weakening? <input type="checkbox" name="fw" /></label><br />
        <label>Thermal Derating? <input type="checkbox" name="thermal" /></label><br />
        <button type="submit">Submit Request</button>
      </form>
      <p>{status}</p>
      <a href="/">Back to Home</a>
    </main>
  );
}