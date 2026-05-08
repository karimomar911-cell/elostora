// ─────────────────────────────────────────────
// Real Supabase table column definitions
// Update here if schema changes — used across all services
// ─────────────────────────────────────────────

export const DB = {
  service_centers: {
    SELECT: 'id, name, logo_url, created_at',
  },

  profiles: {
    SELECT: `
      id,
      full_name,
      role,
      service_center_id,
      created_at,
      service_centers (
        id,
        name,
        logo_url
      )
    `,
  },

  invoices: {
    SELECT: `
      id,
      service_center_id,
      client_id,
      created_by,
      client_name,
      car_model,
      service_date,
      handover_date,
      services_performed,
      spare_parts,
      service_price,
      total_price,
      discount,
      final_price
    `,
    // Joined version for list views
    SELECT_WITH_RELATIONS: `
      id,
      service_center_id,
      client_id,
      created_by,
      client_name,
      car_model,
      service_date,
      handover_date,
      services_performed,
      spare_parts,
      service_price,
      total_price,
      discount,
      final_price,
      service_centers ( id, name ),
      profiles!invoices_client_id_fkey ( id, full_name ),
      creator:profiles!invoices_created_by_fkey ( id, full_name )
    `,
  },
}
