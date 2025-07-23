import TryOnCamera from '@/components/TryOnCamera';

export default function Home() {
  return (
    <main>
      <h1 style={{ textAlign: 'center' }}>Jewelry Try-On Demo</h1>
      <TryOnCamera
        earringImage="/jewelry/earring.png"
        necklaceImage="/jewelry/necklace1.png"
      />
    </main>
  );
}
