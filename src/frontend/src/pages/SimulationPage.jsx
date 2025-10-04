import InfoCard from '../components/InfoCard';

const SimulationPage = () => {
  return (
    <InfoCard
      title="Simulation Controls"
      description="Configure and run asteroid simulations"
      content={
        <div>
          <p className="text-gray-300 mb-4">
            Simulation features coming soon...
          </p>
          <div className="space-y-2">
            <div className="text-sm text-gray-400">
              • Trajectory calculations
            </div>
            <div className="text-sm text-gray-400">
              • Impact scenarios
            </div>
            <div className="text-sm text-gray-400">
              • Orbital mechanics
            </div>
          </div>
        </div>
      }
      footer={null}
      className="w-full max-w-md"
    />
  );
};

export default SimulationPage;
