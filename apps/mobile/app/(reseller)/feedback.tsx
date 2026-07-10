import { FeedbackThreads } from '../../components/feedback-threads';

export default function ResellerFeedbackScreen() {
  return (
    <FeedbackThreads
      title="Platform Geri Bildirim"
      subtitle="Sorularınızı ve önerilerinizi iletin"
      allowCreate
      allowClose={false}
    />
  );
}
