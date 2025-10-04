import InfoCard from '../components/InfoCard';

const AboutPage = () => {
  return (
    <InfoCard
      title="About AsteroidSim"
      content={
        <div className="space-y-4">
          <p className="text-gray-300">
            AsteroidSim is ....
          </p>
        </div>
      }
      footer={null}
      className="w-full max-w-md"
    />
  );
};

export default AboutPage;
