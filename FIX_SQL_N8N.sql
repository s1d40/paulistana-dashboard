INSERT INTO production_lists (
    name,
    preset_id,
    items,
    status,
    created_at
)
VALUES (
    $${{ $json.nome_lista }}$$,
    $${{ $json.preset_id }}$$,
    $${{ JSON.stringify($json.items) }}$$::jsonb,
    'Aguardando',
    NOW()
);
