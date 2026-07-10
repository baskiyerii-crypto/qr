import { useEffect, useState } from 'react';

import { Text, TouchableOpacity } from 'react-native';

import { api } from '../../lib/api';

import { Card, Button } from '../../components/ui';

import { FormInput, ScreenScroll, screen } from '../../components/screen';



const STATUS: Record<string, string> = {

  SUBMITTED: 'Gönderildi', UNDER_REVIEW: 'İnceleniyor', APPROVED: 'Onaylandı', REJECTED: 'Reddedildi',

};



export default function AdminApplicationsScreen() {

  const [items, setItems] = useState<Array<{

    id: string; firstName: string; lastName: string; email: string; companyName: string | null; status: string;

  }>>([]);

  const [selected, setSelected] = useState<string | null>(null);

  const [detail, setDetail] = useState<{ status: string; reviewNotes: string | null; phone: string } | null>(null);

  const [approveCode, setApproveCode] = useState('');

  const [iban, setIban] = useState('');

  const [rejectReason, setRejectReason] = useState('');

  const [reviewNotes, setReviewNotes] = useState('');



  const load = () => api.get<typeof items>('/admin/reseller-applications').then(setItems).catch(() => {});

  useEffect(() => { load(); }, []);



  const open = async (id: string) => {

    setSelected(id);

    const d = await api.get<NonNullable<typeof detail>>(`/admin/reseller-applications/${id}`);

    setDetail(d);

    setReviewNotes(d.reviewNotes || '');

  };



  const approve = async () => {

    if (!selected) return;

    await api.post(`/admin/reseller-applications/${selected}/approve`, { code: approveCode.toUpperCase(), iban: iban || undefined });

    setSelected(null);

    load();

  };



  const reject = async () => {

    if (!selected) return;

    await api.post(`/admin/reseller-applications/${selected}/reject`, { rejectionReason: rejectReason });

    setSelected(null);

    load();

  };



  if (selected && detail) {

    return (

      <ScreenScroll>

        <Button title="← Listeye dön" onPress={() => setSelected(null)} variant="ghost" />

        <Text style={screen.title}>{STATUS[detail.status] || detail.status}</Text>

        <Text style={screen.muted}>{detail.phone}</Text>

        <Card style={{ marginVertical: 12 }}>

          <FormInput placeholder="İnceleme notu" value={reviewNotes} onChangeText={setReviewNotes} />

          <Button title="İncelemeye Al" onPress={() => api.patch(`/admin/reseller-applications/${selected}/review`, { reviewNotes }).then(() => open(selected!))} variant="secondary" />

        </Card>

        {detail.status !== 'APPROVED' && detail.status !== 'REJECTED' && (

          <>

            <Card>

              <FormInput placeholder="Bayi kodu" value={approveCode} onChangeText={(v) => setApproveCode(v.toUpperCase())} autoCapitalize="characters" />

              <FormInput placeholder="IBAN (iyzico)" value={iban} onChangeText={setIban} />

              <Button title="Onayla" onPress={approve} />

            </Card>

            <Card style={{ marginTop: 12 }}>

              <FormInput placeholder="Red nedeni" value={rejectReason} onChangeText={setRejectReason} />

              <Button title="Reddet" onPress={reject} variant="secondary" />

            </Card>

          </>

        )}

      </ScreenScroll>

    );

  }



  return (

    <ScreenScroll>

      {items.map((a) => (

        <TouchableOpacity key={a.id} onPress={() => open(a.id)}>

          <Card style={{ marginBottom: 8 }}>

            <Text style={{ fontWeight: '600' }}>{a.firstName} {a.lastName}</Text>

            <Text style={screen.muted}>{a.email}</Text>

            <Text style={screen.muted}>{a.companyName || '—'} · {STATUS[a.status] || a.status}</Text>

          </Card>

        </TouchableOpacity>

      ))}

      {!items.length && <Text style={screen.empty}>Başvuru yok</Text>}

    </ScreenScroll>

  );

}

