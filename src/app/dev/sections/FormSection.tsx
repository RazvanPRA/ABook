import React, { useState } from 'react';
import { Select, TextField, type SelectOption } from '@/shared/ui';
import { CatalogSection } from '../CatalogSection';

type SampleLanguage = 'ro-RO' | 'en-US';

const LANGUAGES: readonly SelectOption<SampleLanguage>[] = [
  { value: 'ro-RO', label: 'Română (ro-RO)' },
  { value: 'en-US', label: 'Engleză (en-US)' },
];

/** The "Detalii carte" form of the import screen: text fields and the language select. */
export function FormSection() {
  const [title, setTitle] = useState('Ion');
  const [author, setAuthor] = useState('Liviu Rebreanu');
  const [language, setLanguage] = useState<SampleLanguage>('ro-RO');
  return (
    <CatalogSection title="Câmpuri de formular">
      <TextField label="Titlu" value={title} onChangeText={setTitle} />
      <TextField
        label="Autor"
        value={author}
        onChangeText={setAuthor}
        placeholder="Necunoscut"
      />
      <Select<SampleLanguage>
        label="Limba vocii"
        options={LANGUAGES}
        value={language}
        onChange={setLanguage}
        closeLabel="Închide"
      />
      <TextField
        label="Titlu (eroare)"
        value=""
        onChangeText={() => {}}
        error="Titlul e obligatoriu"
      />
      <TextField
        label="Fișier (doar citire)"
        value="ion-rebreanu.pdf"
        onChangeText={() => {}}
        editable={false}
      />
    </CatalogSection>
  );
}
