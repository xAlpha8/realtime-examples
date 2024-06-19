import styles from './App.module.css';
import FileUpload from './components/FileUpload';

function App() {

  return (
    <div className={styles.root}>
      <h1>Video Surveillance</h1>
      <FileUpload />
    </div>
  )
}

export default App
