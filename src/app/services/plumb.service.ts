import {
  ComponentFactoryResolver,
  ElementRef,
  Injectable,
  ViewContainerRef,
} from '@angular/core';
import { BrowserJsPlumbInstance, newInstance } from '@jsplumb/browser-ui';
import { EVENT_GROUP_MEMBER_ADDED, UIGroup } from '@jsplumb/core';
import { PointXY } from '@jsplumb/util';

import { ElementComponent } from '../components/element/element.component';
import { GroupComponent } from '../components/group/group.component';

@Injectable({
  providedIn: 'root',
})
export class PlumbService {
  private containerRef: ViewContainerRef | undefined;
  jsPlumbInstance: BrowserJsPlumbInstance | undefined;

  constructor(private factoryResolver: ComponentFactoryResolver) {}

  public initializeJsInstance(rootElementRef: ElementRef) {
    this.jsPlumbInstance = newInstance({
      container: rootElementRef.nativeElement,
    });

    this.setHandlers();
  }

  public setContainer(containerRef: ViewContainerRef) {
    this.containerRef = containerRef;
  }

  public addElement(elementId: string) {
    if (!this.containerRef) {
      throw new Error('Root container not initialized');
    }

    if (!this.jsPlumbInstance) {
      throw new Error('jsPlumbInstance is not yet set');
    }

    const factory =
      this.factoryResolver.resolveComponentFactory(ElementComponent);
    const componentRef =
      this.containerRef.createComponent<ElementComponent>(factory);
    componentRef.instance.elementId = elementId;
    componentRef.instance.jsPlumbInstance = this.jsPlumbInstance;
    return componentRef;
  }

  public addGroup(elementId: string) {
    if (!this.containerRef) {
      throw new Error('Root container not initialized');
    }

    if (!this.jsPlumbInstance) {
      throw new Error('jsPlumbInstance is not yet set');
    }

    const factory =
      this.factoryResolver.resolveComponentFactory(GroupComponent);
    const componentRef =
      this.containerRef.createComponent<GroupComponent>(factory);
    componentRef.instance.elementId = elementId;
    componentRef.instance.jsPlumbInstance = this.jsPlumbInstance;
    return componentRef;
  }

  private setHandlers() {
    if (!this.jsPlumbInstance) {
      throw new Error('jsPlumbInstance is not yet set');
    }

    this.jsPlumbInstance.bind(
      EVENT_GROUP_MEMBER_ADDED,
      (params: {
        group: UIGroup<HTMLElement>;
        el: HTMLElement;
        pos: PointXY;
      }) => {
        this.adjustPositionAndUI(params.el, params.group);
        setTimeout(() => {
          this.jsPlumbInstance?.repaint(params.group.el);
        }, 0);
      }
    );
  }

  private adjustPositionAndUI(
    element: HTMLElement,
    group: UIGroup<HTMLElement>
  ) {
    this.adjustGroupWidth(group);
    this.setElementPositionInGroup(group, element);
    this.adjustGroupHeight(element, group.el);
  }

  private adjustGroupWidth(group: UIGroup<HTMLElement>) {
    let maxWidth = 0;
    group.children.forEach((child) => {
      if (child.el.offsetWidth > maxWidth) {
        maxWidth = child.el.offsetWidth;
      }
    });

    if (group.el.offsetWidth < maxWidth + 10) {
      group.el.style.width = maxWidth + 10 + 'px';
    }
  }

  private adjustGroupHeight(element: HTMLElement, groupEle: HTMLElement) {
    const bottomSpace = parseInt(
      getComputedStyle(element).bottom.replace('px', '')
    );
    if (bottomSpace <= 0) {
      groupEle.style.height =
        groupEle.offsetHeight + Math.abs(bottomSpace) + 'px';
    }
  }

  private setElementPositionInGroup(
    group: UIGroup<HTMLElement>,
    element: HTMLElement
  ) {
    const position = calculatePosition(group, element);
    this.jsPlumbInstance?.setPosition(element, position);
  }
}
function calculatePosition(group: UIGroup<HTMLElement>, element: HTMLElement) {
  const left = (group.el.offsetWidth - element.offsetWidth) / 2;

  let totalOffset = 0;
  let count = 1;
  for (let index = 0; index < group.children.length - 1; ++index) {
    const child = group.children[index];
    totalOffset += child.el.offsetHeight;
    ++count;
  }

  const top = totalOffset + count * 5;

  return { x: left, y: top };
}
