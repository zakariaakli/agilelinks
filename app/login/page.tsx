import Auth from '../../Components/Auth';
import Seo from '../../Components/Seo';

export default function LoginPage() {
  return (
    <>
        <Seo title="Log in" description='description' image='' url=''  />
        <main style={{padding: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}>
                <Auth />
            </div>
        </main>
    </>
  );
}