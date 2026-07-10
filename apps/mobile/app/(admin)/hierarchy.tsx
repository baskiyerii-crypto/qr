import { useEffect, useState } from 'react';

import { Text } from 'react-native';

import { api } from '../../lib/api';

import { Card } from '../../components/ui';

import { ScreenScroll, screen } from '../../components/screen';



type Node = { id: string; name: string; type: string; children?: Node[] };



function renderNodes(nodes: Node[] | undefined, depth = 0): React.ReactNode {

  if (!nodes?.length) return null;

  return nodes.map((n) => (

    <Card key={n.id} style={{ marginBottom: 8, marginLeft: depth * 12 }}>

      <Text style={{ fontWeight: '600' }}>{n.name}</Text>

      <Text style={screen.muted}>{n.type}</Text>

      {renderNodes(n.children, depth + 1)}

    </Card>

  ));

}



export default function AdminHierarchyScreen() {

  const [data, setData] = useState<{ tree: Node[] } | null>(null);

  useEffect(() => {

    api.get<NonNullable<typeof data>>('/admin/hierarchy').then(setData).catch(() => {});

  }, []);



  return (

    <ScreenScroll>

      {renderNodes(data?.tree)}

      {!data?.tree?.length && <Text style={screen.empty}>Veri yok</Text>}

    </ScreenScroll>

  );

}

