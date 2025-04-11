import Auth from '../Components/Auth';
import Seo from '../Components/Seo';
import styles from '../Styles/product.module.css';

export default function LoginPage() {
  return (
    <>
        <Seo title="Log in" />
        <main style={{padding: '20px'}}>
        <h1 className={styles.formTitle}>Log in</h1>
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}>
                <Auth />
            </div>
        </main>
    </>
  );
}