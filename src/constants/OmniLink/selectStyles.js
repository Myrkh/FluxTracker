export const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '44px',
    borderRadius: '0.5rem',
    borderWidth: '2px',
    borderColor: state.isFocused ? '#00375A' : '#E2E8F0',
    boxShadow: state.isFocused ? '0 0 0 4px rgba(0, 55, 90, 0.1)' : 'none',
    '&:hover': { borderColor: '#0091D5' },
    fontSize: '0.875rem',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#00375A' : state.isFocused ? 'rgba(0, 55, 90, 0.05)' : 'white',
    color: state.isSelected ? 'white' : '#1E293B',
    cursor: 'pointer',
    fontSize: '0.875rem',
    '&:active': { backgroundColor: '#00375A' }
  }),
  menu: (base) => ({
    ...base, borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 55, 90, 0.1), 0 4px 6px -2px rgba(0, 55, 90, 0.05)',
    border: '2px solid #E2E8F0', overflow: 'hidden', marginTop: '0.5rem'
  }),
  menuPortal: base => ({ ...base, zIndex: 9999 }),
};
