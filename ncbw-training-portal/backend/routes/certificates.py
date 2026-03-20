# from flask import Blueprint, send_file, jsonify, request
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from io import BytesIO
# from reportlab.pdfgen import canvas
# from reportlab.lib.pagesizes import letter, landscape
# from reportlab.lib.colors import HexColor, black, white
# from models import db, User, Certificate, CertificateTemplate, Track
#
# certificates_bp = Blueprint('certificates', __name__)
#
# GOLD       = HexColor('#c6930a')
# GOLD_DARK  = HexColor('#a37808')
# WHITE      = HexColor('#ffffff')
# OFF_WHITE  = HexColor('#fefbf3')
# GREY       = HexColor('#666666')
# LIGHT_GREY = HexColor('#eeeeee')
# BLACK_COL  = HexColor('#000000')
#
# TEMPLATES = {
#     'standard': {
#         'bg':           WHITE,
#         'border_color': GOLD,
#         'border_width': 20,
#         'inner_border': True,
#     },
#     'elegant': {
#         'bg':           OFF_WHITE,
#         'border_color': BLACK_COL,
#         'border_width': 15,
#         'inner_border': True,
#     },
#     'modern': {
#         'bg':           WHITE,
#         'border_color': GOLD,
#         'border_width': 10,
#         'inner_border': False,
#     },
#     'classic': {
#         'bg':           HexColor('#fffef8'),
#         'border_color': HexColor('#8b7355'),
#         'border_width': 25,
#         'inner_border': True,
#     },
# }
#
# def is_admin():
#     user_id = int(get_jwt_identity())
#     user = User.query.get(user_id)
#     return user and user.role == 'admin'
#
# def make_certificate_pdf(cert):
#
#     first_name  = cert.user.first_name
#     last_name   = cert.user.last_name
#     full_name   = first_name + ' ' + last_name
#     track_name  = cert.track.name
#     date_str    = cert.issued_at.strftime('%B %d, %Y')
#
#     if cert.template:
#         sig1          = cert.template.first_signature_name
#         sig2          = cert.template.second_signature_name
#         template_type = cert.template.template_type or 'standard'
#     else:
#         sig1          = 'Administrator Signature'
#         sig2          = 'Chapter President'
#         template_type = 'standard'
#
#     style = TEMPLATES.get(template_type, TEMPLATES['standard'])
#
#     page_w, page_h = landscape(letter)
#
#     buffer = BytesIO()
#     c = canvas.Canvas(buffer, pagesize=(page_w, page_h))
#     c.setTitle('Certificate of Completion')
#
#     bw = style['border_width']
#
#     c.setFillColor(style['bg'])
#     c.rect(0, 0, page_w, page_h, fill=1, stroke=0)
#
#     c.setStrokeColor(style['border_color'])
#     c.setLineWidth(bw)
#     margin = bw / 2
#     c.rect(margin, margin, page_w - bw, page_h - bw, fill=0, stroke=1)
#
#     if style['inner_border']:
#         c.setLineWidth(2)
#         inner = bw + 10
#         c.rect(inner, inner, page_w - inner * 2, page_h - inner * 2, fill=0, stroke=1)
#
#     c.setFillColor(GOLD)
#     c.setFont('Helvetica-Bold', 36)
#     c.drawCentredString(page_w / 2, page_h - 85, '* * *')
#
#     c.setFillColor(GOLD)
#     c.setFont('Helvetica-Bold', 22)
#     c.drawCentredString(page_w / 2, page_h - 115,
#                         'NATIONAL COALITION OF 100 BLACK WOMEN')
#
#     c.setFillColor(GREY)
#     c.setFont('Helvetica', 14)
#     c.drawCentredString(page_w / 2, page_h - 138,
#                         'Queen City Metropolitan Chapter')
#
#     c.setFillColor(GOLD)
#     c.setFont('Helvetica-Bold', 38)
#     c.drawCentredString(page_w / 2, page_h - 195,
#                         'Certificate of Completion')
#
#     c.setFillColor(GREY)
#     c.setFont('Helvetica-Oblique', 16)
#     c.drawCentredString(page_w / 2, page_h - 240,
#                         'This certificate is proudly presented to')
#
#     c.setFillColor(BLACK_COL)
#     c.setFont('Helvetica-Bold', 34)
#     c.drawCentredString(page_w / 2, page_h - 285, full_name)
#
#     name_w = c.stringWidth(full_name, 'Helvetica-Bold', 34)
#     ux = (page_w - name_w) / 2
#     c.setStrokeColor(GOLD)
#     c.setLineWidth(2)
#     c.line(ux, page_h - 294, ux + name_w, page_h - 294)
#
#     c.setFillColor(GREY)
#     c.setFont('Helvetica', 14)
#     c.drawCentredString(page_w / 2, page_h - 325,
#                         'For successfully completing the comprehensive leadership training program')
#
#     c.setFillColor(GOLD)
#     c.setFont('Helvetica-Bold', 20)
#     c.drawCentredString(page_w / 2, page_h - 358, track_name)
#
#     c.setFillColor(GREY)
#     c.setFont('Helvetica', 12)
#     c.drawCentredString(page_w / 2, page_h - 385,
#                         'Demonstrating dedication, knowledge, and commitment to excellence in leadership development')
#
#     c.setFillColor(GREY)
#     c.setFont('Helvetica', 13)
#     c.drawCentredString(page_w / 2, page_h - 420,
#                         'Date of Completion: ' + date_str)
#
#     sig_y_line = 95
#     sig_y_text = 80
#     sig_half   = 110
#
#     left_cx  = page_w * 0.30
#     right_cx = page_w * 0.70
#
#     c.setStrokeColor(BLACK_COL)
#     c.setLineWidth(2)
#     c.line(left_cx - sig_half, sig_y_line, left_cx + sig_half, sig_y_line)
#     c.setFillColor(GREY)
#     c.setFont('Helvetica', 12)
#     c.drawCentredString(left_cx, sig_y_text, sig1)
#
#     c.line(right_cx - sig_half, sig_y_line, right_cx + sig_half, sig_y_line)
#     c.drawCentredString(right_cx, sig_y_text, sig2)
#
#     c.setStrokeColor(HexColor('#d4a017'))
#     c.setLineWidth(0.5)
#     c.setFillColor(HexColor('#f5f5f5'))
#
#     c.save()
#     buffer.seek(0)
#
#     filename = ('NCBW_Certificate_'
#                 + last_name + '_'
#                 + first_name + '_'
#                 + track_name.replace(' ', '_')
#                 + '.pdf')
#
#     return send_file(buffer,
#                      mimetype='application/pdf',
#                      as_attachment=True,
#                      download_name=filename)
#
# @certificates_bp.route('/issue', methods=['POST'])
# @jwt_required()
# def issue_certificate():
#     if not is_admin():
#         return jsonify({'error': 'Admin access required'}), 403
#
#     data     = request.get_json()
#     user_id  = data.get('user_id')
#     track_id = data.get('track_id')
#
#     if not user_id or not track_id:
#         return jsonify({'error': 'user_id and track_id are required'}), 400
#
#     User.query.get_or_404(user_id)
#     Track.query.get_or_404(track_id)
#
#     cert = Certificate.query.filter_by(user_id=user_id, track_id=track_id).first()
#     if not cert:
#         template = CertificateTemplate.query.filter_by(track_id=track_id).first()
#         cert = Certificate(
#             user_id     = user_id,
#             track_id    = track_id,
#             template_id = template.id if template else None
#         )
#         db.session.add(cert)
#         db.session.commit()
#
#     return make_certificate_pdf(cert)
#
# @certificates_bp.route('/<int:cert_id>/download', methods=['GET'])
# @jwt_required()
# def download_certificate(cert_id):
#     current_id   = int(get_jwt_identity())
#     current_user = User.query.get_or_404(current_id)
#     cert         = Certificate.query.get_or_404(cert_id)
#
#     if current_user.role != 'admin' and cert.user_id != current_id:
#         return jsonify({'error': 'Access denied'}), 403
#
#     return make_certificate_pdf(cert)
#
# @certificates_bp.route('/', methods=['GET'])
# @jwt_required()
# def list_certificates():
#     if not is_admin():
#         return jsonify({'error': 'Admin access required'}), 403
#
#     certs  = Certificate.query.order_by(Certificate.issued_at.desc()).all()
#     result = []
#
#     for cert in certs:
#         result.append({
#             'id':           cert.id,
#             'user_name':    cert.user.first_name + ' ' + cert.user.last_name,
#             'track_name':   cert.track.name,
#             'template':     cert.template.template_type if cert.template else 'standard',
#             'issued_at':    cert.issued_at.strftime('%b %d, %Y'),
#             'download_url': '/api/certificates/' + str(cert.id) + '/download'
#         })
#
#     return jsonify(result), 200
#
# @certificates_bp.route('/<int:cert_id>', methods=['DELETE'])
# @jwt_required()
# def delete_certificate(cert_id):
#     if not is_admin():
#         return jsonify({'error': 'Admin access required'}), 403
#
#     cert = Certificate.query.get_or_404(cert_id)
#     db.session.delete(cert)
#     db.session.commit()
#
#     return jsonify({'message': 'Certificate deleted'}), 200
