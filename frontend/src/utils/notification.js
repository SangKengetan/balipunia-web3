import Swal from 'sweetalert2';

// Warna yang disesuaikan dengan tema aplikasi
const PRIMARY_COLOR = '#2563eb'; // blue-600

export const showSuccess = (title, text) => {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: text,
    confirmButtonColor: PRIMARY_COLOR,
    confirmButtonText: 'Tutup',
  });
};

export const showError = (title, text, solution = '') => {
  const htmlContent = solution
    ? `<div style="text-align: center;">
         <p>${text}</p>
         <div style="margin-top: 15px; padding: 10px; background: #fef2f2; color: #991b1b; border-radius: 8px; font-size: 0.9em;">
           <strong>Solusi:</strong> ${solution}
         </div>
       </div>`
    : text;

  return Swal.fire({
    icon: 'error',
    title: title,
    html: solution ? htmlContent : undefined,
    text: !solution ? text : undefined,
    confirmButtonColor: PRIMARY_COLOR,
    confirmButtonText: 'Mengerti',
  });
};

export const showInfo = (title, text) => {
  return Swal.fire({
    icon: 'info',
    title: title,
    text: text,
    confirmButtonColor: PRIMARY_COLOR,
    confirmButtonText: 'OK',
  });
};
