import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Chip, ChipGroup, ListRow, Slider, Switch } from '@/shared/ui';
import { styles } from '../catalog.styles';
import { CatalogSection } from '../CatalogSection';
import { sample, type SampleFilter } from '../samples';

export function ControlsSection() {
  const [filter, setFilter] = useState<SampleFilter>('all');
  const [highlight, setHighlight] = useState(true);
  const [background, setBackground] = useState(false);
  const [speed, setSpeed] = useState(1);
  return (
    <CatalogSection title="Chips, comutatoare, glisoare">
      <View style={styles.row}>
        {sample.metadata.map(label => (
          <Chip key={label} label={label} />
        ))}
      </View>
      <ChipGroup<SampleFilter>
        options={sample.filters}
        value={filter}
        onChange={setFilter}
        accessibilityLabel="Filtru"
      />
      <Card padded={false}>
        <ListRow
          title="Evidențiază fraza citită"
          subtitle="Urmărești textul în timp ce asculți"
          trailing={
            <Switch
              value={highlight}
              onValueChange={setHighlight}
              accessibilityLabel="Evidențiază fraza citită"
            />
          }
        />
        <ListRow
          title="Redare în fundal"
          subtitle="Continuă cu ecranul blocat"
          divider={false}
          trailing={
            <Switch
              value={background}
              onValueChange={setBackground}
              accessibilityLabel="Redare în fundal"
            />
          }
        />
      </Card>
      <Card>
        <Slider
          label="Viteză implicită"
          valueLabel={`${speed.toFixed(1)}×`}
          value={speed}
          range={{ min: 0.5, max: 2, step: 0.1 }}
          onChange={setSpeed}
        />
        <Slider
          label="Ton"
          valueLabel="Normal"
          valueTone="muted"
          value={1}
          range={{ min: 0.5, max: 1.5, step: 0.1 }}
        />
      </Card>
    </CatalogSection>
  );
}
