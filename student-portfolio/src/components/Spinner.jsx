import './Spinner.css';

function Spinner({ message = 'Fetching repositories...' }) {
  return (
    <div className="spinner-wrapper">
      <div className="spinner-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <p className="spinner-text">{message}</p>
    </div>
  );
}

export default Spinner;
