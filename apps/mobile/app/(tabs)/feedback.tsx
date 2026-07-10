import { FeedbackThreads } from '../../components/feedback-threads';

export default function FeedbackScreen() {
  return (
    <FeedbackThreads
      title="Geri Bildirim"
      subtitle="Yöneticinize geri bildirim gönderin"
      allowCreate
      allowClose={false}
    />
  );
}
