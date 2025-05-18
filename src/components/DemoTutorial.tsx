import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DemoTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoTutorial = ({ isOpen, onClose }: DemoTutorialProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[1000px] h-[80vh] p-0">
        <div className="relative w-full h-full">
          <iframe
            src="https://app.supademo.com/embed/cma5a636c48vj13m00xqzvb2r?embed_v=2"
            loading="lazy"
            title="StudyTheSkill Demo"
            allow="clipboard-write"
            frameBorder="0"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoTutorial; 