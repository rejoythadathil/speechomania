import { Dialog, Heading, Modal as AriaModal, ModalOverlay } from 'react-aria-components'
import { CloseButton } from '@/components/base/buttons/close-button'
import { cx } from '@/utils/cx'
import styles from './modal.module.css'

export function Modal({ isOpen, onOpenChange, title, description, footer, size, children }) {
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable className={styles.overlay}>
      <AriaModal className={cx(styles.modal, size === 'wide' && styles.wide)}>
        <Dialog className={styles.dialog}>
          {({ close }) => (
            <>
              <div className={styles.header}>
                <div className="flex flex-col gap-1">
                  <Heading slot="title" className="font-display text-title-3-semibold text-text-primary">{title}</Heading>
                  {description ? <p className="text-body-2-regular text-text-secondary">{description}</p> : null}
                </div>
                <CloseButton aria-label="Close" onClick={close} />
              </div>
              <div className={styles.body}>{children}</div>
              {footer ? <div className={styles.footer}>{footer}</div> : null}
            </>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  )
}
