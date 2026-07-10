import { FeedbackThreads } from '../../components/feedback-threads';

export default function AdminFeedbackScreen() {
  return (
    <FeedbackThreads
      title="Geri Bildirimler"
      subtitle="Bayi platform geri bildirimleri"
      allowCreate={false}
      allowClose
      threadMeta={(t) =>
        [
          t.reseller?.companyName,
          t.createdAt ? new Date(t.createdAt).toLocaleDateString('tr-TR') : null,
        ]
          .filter(Boolean)
          .join(' · ')
      }
    />
  );
}
